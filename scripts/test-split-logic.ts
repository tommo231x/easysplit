


const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log("Starting Logic Test...");

    // 1. Create Split
    console.log("1. Creating Split...");
    const createRes = await fetch(`${BASE_URL}/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            people: [{ id: 'tom', name: 'Tom' }, { id: 'dave', name: 'Dave' }],
            items: [{ id: 1, name: 'Pizza', price: 10 }],
            quantities: [{ itemId: 1, personId: 'tom', quantity: 0.5 }],
            totals: [{ person: { id: 'tom', name: 'Tom' }, subtotal: 0, service: 0, tip: 0, total: 0 }],
            currency: '£',
            serviceCharge: 10,
            tipPercent: 0,
            draftData: JSON.stringify({
                orderItems: [
                    { instanceId: 'item1', name: 'Pizza', price: 10, ownerId: 'tom', assignedTo: ['tom', 'dave'] }
                ]
            })
        })
    });

    if (!createRes.ok) {
        console.error("Create failed", await createRes.text());
        return;
    }

    const split = await createRes.json();
    const code = split.code;
    console.log(`   Split Created: ${code}`);

    // 2. Fetch to verify initial state
    console.log("2. Verifying Initial State...");
    const fetch1 = await fetch(`${BASE_URL}/splits/${code}`);
    const s1 = await fetch1.json();
    const draft1 = JSON.parse(s1.draftData);
    const assignees1 = draft1.orderItems[0].assignedTo;
    console.log(`   Item assigned to: ${assignees1.join(', ')}`);

    if (!assignees1.includes('dave')) console.error("FAIL: Dave not assigned");

    // 3. Delete Tom (Simulating Client Action)
    console.log("3. Deleting Tom (Update)...");
    // Client logic (handleRemove) would filter Tom out.
    // We simulate the EXACT payload the client *should* send.

    const newPeople = [{ id: 'dave', name: 'Dave' }];
    const newOrderItems = [
        { instanceId: 'item1', name: 'Pizza', price: 10, ownerId: 'tom', assignedTo: ['dave'] }
        // ^ CLIENT logic should have removed 'tom'. If client sends ['tom', 'dave'], backend stores it.
        // The issue might be: Client Sends -> Backend Merges -> Returns.
    ];

    const updateRes = await fetch(`${BASE_URL}/splits/${code}`, {
        method: 'PATCH', // Fixed: Routes uses PATCH for updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            people: newPeople,
            items: [{ id: 1, name: 'Pizza', price: 10 }], // maintain legacy schema reqs
            quantities: [{ itemId: 1, personId: 'dave', quantity: 1 }],
            totals: [{ person: { id: 'dave', name: 'Dave' }, subtotal: 0, service: 0, tip: 0, total: 0 }],
            currency: '£',
            serviceCharge: 10,
            tipPercent: 0,
            draftData: JSON.stringify({ orderItems: newOrderItems })
        })
    });

    const updatedSplit = await updateRes.json();
    console.log("   Update Response Received.");

    // 4. Verify Final State
    console.log("4. Verifying Final State...");
    const fetch2 = await fetch(`${BASE_URL}/splits/${code}`);
    const s2 = await fetch2.json();
    const draft2 = JSON.parse(s2.draftData);
    const assignees2 = draft2.orderItems[0].assignedTo;

    console.log(`   Item assigned to: ${assignees2.join(', ')}`);

    if (assignees2.includes('tom')) {
        console.error("FAIL: Tom still assigned! Sync/Update failed.");
    } else {
        console.log("SUCCESS: Tom removed from assignments.");
    }
}

runTest().catch(console.error);
