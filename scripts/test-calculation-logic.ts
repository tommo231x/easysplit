
// Type definitions locally to match schema
interface Person {
    id: string;
    name: string;
}

interface OrderItem {
    id?: number;
    instanceId: string;
    originalId: number;
    name: string;
    price: number;
    ownerId?: string; // Who added it
    assignedTo: string[]; // Who pays for it
}

// Logic extracted from client/src/pages/split-bill.tsx
function calculateSplit(people: Person[], orderItems: OrderItem[], serviceCharge: number, tipPercent: number) {
    const calculatedTotals = people.map(person => {
        let subtotal = 0;
        orderItems.forEach(item => {
            // Validation: Ensure assignedTo is valid array
            const assignees = item.assignedTo || [];

            if (assignees.includes(person.id)) {
                // Guard against divide by zero (though unlikely if includes is true)
                const count = assignees.length || 1;
                subtotal += item.price / count;
            }
        });

        const serviceAmt = subtotal * (serviceCharge / 100);
        const tipAmt = subtotal * (tipPercent / 100);

        return {
            person: person.name,
            subtotal,
            service: serviceAmt,
            tip: tipAmt,
            total: subtotal + serviceAmt + tipAmt
        };
    });

    return calculatedTotals;
}

// Test Case
function runTest() {
    console.log("Starting Split Bill Calculation Test...");

    const people: Person[] = [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" }
    ];

    const orderItems: OrderItem[] = [
        // Pizza 30, Split between Alice and Bob
        { instanceId: "i1", originalId: 0, name: "Pizza", price: 30, assignedTo: ["p1", "p2"] },
        // Drinks 15, Charlie only
        { instanceId: "i2", originalId: 0, name: "Drinks", price: 15, assignedTo: ["p3"] },
        // Dessert 10, All 3
        { instanceId: "i3", originalId: 0, name: "Dessert", price: 10, assignedTo: ["p1", "p2", "p3"] }
    ];

    const serviceCharge = 0; // Keeping it simple for verification
    const tipPercent = 0;

    console.log("Inputs:", { people: people.map(p => p.name), items: orderItems.map(i => `${i.name}: ${i.price} (Split: ${i.assignedTo.length})`) });

    const results = calculateSplit(people, orderItems, serviceCharge, tipPercent);

    console.log("\nResults:");
    let totalSum = 0;
    results.forEach(r => {
        console.log(`${r.person}: Subtotal=${r.subtotal.toFixed(2)}, Total=${r.total.toFixed(2)}`);
        totalSum += r.total;
    });

    console.log(`\nGrand Total: ${totalSum.toFixed(2)}`);

    // Verification
    const expectedTotal = 30 + 15 + 10; // 55
    if (Math.abs(totalSum - expectedTotal) < 0.01) {
        console.log("SUCCESS: Grand Total matches expected value.");
    } else {
        console.error(`FAILURE: Expected ${expectedTotal}, got ${totalSum}`);
    }

    // Alice Check: Pizza/2 (15) + Dessert/3 (3.333) = 18.33
    const alice = results.find(r => r.person === "Alice");
    if (alice && Math.abs(alice.total - 18.33) < 0.01) {
        console.log("SUCCESS: Alice share is correct.");
    } else {
        console.error(`FAILURE: Alice share incorrect. Expected ~18.33, got ${alice?.total}`);
    }

    // Bob Check: Pizza/2 (15) + Dessert/3 (3.333) = 18.33
    const bob = results.find(r => r.person === "Bob");
    if (bob && Math.abs(bob.total - 18.33) < 0.01) {
        console.log("SUCCESS: Bob share is correct.");
    } else {
        console.error(`FAILURE: Bob share incorrect. Expected ~18.33, got ${bob?.total}`);
    }

    // Charlie Check: Drinks (15) + Dessert/3 (3.333) = 18.33
    const charlie = results.find(r => r.person === "Charlie");
    if (charlie && Math.abs(charlie.total - 18.33) < 0.01) {
        console.log("SUCCESS: Charlie share is correct.");
    } else {
        console.error(`FAILURE: Charlie share incorrect. Expected ~18.33, got ${charlie?.total}`);
    }
}

runTest();
