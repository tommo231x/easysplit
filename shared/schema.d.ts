import { z } from "zod";
export declare const menuSchema: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    code: string;
    currency: string;
    createdAt: string;
    name?: string | undefined;
}, {
    id: number;
    code: string;
    createdAt: string;
    name?: string | undefined;
    currency?: string | undefined;
}>;
export declare const menuItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    menuId: z.ZodNumber;
    name: z.ZodString;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    menuId: number;
    price: number;
}, {
    id: number;
    name: string;
    menuId: number;
    price: number;
}>;
export declare const insertMenuSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
    }, {
        name: string;
        price: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    currency: string;
    items: {
        name: string;
        price: number;
    }[];
    name?: string | undefined;
}, {
    items: {
        name: string;
        price: number;
    }[];
    name?: string | undefined;
    currency?: string | undefined;
}>;
export declare const insertMenuItemSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
}, {
    name: string;
    price: number;
}>;
export type Menu = z.infer<typeof menuSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export declare const personSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export declare const itemQuantitySchema: z.ZodObject<{
    itemId: z.ZodNumber;
    personId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    itemId: number;
    personId: string;
    quantity: number;
}, {
    itemId: number;
    personId: string;
    quantity: number;
}>;
export declare const personTotalSchema: z.ZodObject<{
    person: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>;
    subtotal: z.ZodNumber;
    service: z.ZodNumber;
    tip: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    person: {
        id: string;
        name: string;
    };
    subtotal: number;
    service: number;
    tip: number;
    total: number;
}, {
    person: {
        id: string;
        name: string;
    };
    subtotal: number;
    service: number;
    tip: number;
    total: number;
}>;
export declare const billSplitSchema: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodString;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    menuCode: z.ZodNullable<z.ZodString>;
    people: z.ZodString;
    items: z.ZodString;
    quantities: z.ZodString;
    currency: z.ZodString;
    serviceCharge: z.ZodNumber;
    tipPercent: z.ZodNumber;
    totals: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    code: string;
    currency: string;
    createdAt: string;
    items: string;
    menuCode: string | null;
    people: string;
    quantities: string;
    serviceCharge: number;
    tipPercent: number;
    totals: string;
    name?: string | null | undefined;
}, {
    id: number;
    code: string;
    currency: string;
    createdAt: string;
    items: string;
    menuCode: string | null;
    people: string;
    quantities: string;
    serviceCharge: number;
    tipPercent: number;
    totals: string;
    name?: string | null | undefined;
}>;
export declare const billSplitItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    menuId: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    price: number;
    menuId?: number | undefined;
}, {
    id: number;
    name: string;
    price: number;
    menuId?: number | undefined;
}>;
export declare const insertBillSplitSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    menuCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    people: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>, "many">;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        menuId: z.ZodOptional<z.ZodNumber>;
        name: z.ZodString;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        price: number;
        menuId?: number | undefined;
    }, {
        id: number;
        name: string;
        price: number;
        menuId?: number | undefined;
    }>, "many">;
    quantities: z.ZodArray<z.ZodObject<{
        itemId: z.ZodNumber;
        personId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        itemId: number;
        personId: string;
        quantity: number;
    }, {
        itemId: number;
        personId: string;
        quantity: number;
    }>, "many">;
    currency: z.ZodString;
    serviceCharge: z.ZodNumber;
    tipPercent: z.ZodNumber;
    totals: z.ZodArray<z.ZodObject<{
        person: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
        }, {
            id: string;
            name: string;
        }>;
        subtotal: z.ZodNumber;
        service: z.ZodNumber;
        tip: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        person: {
            id: string;
            name: string;
        };
        subtotal: number;
        service: number;
        tip: number;
        total: number;
    }, {
        person: {
            id: string;
            name: string;
        };
        subtotal: number;
        service: number;
        tip: number;
        total: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    currency: string;
    items: {
        id: number;
        name: string;
        price: number;
        menuId?: number | undefined;
    }[];
    people: {
        id: string;
        name: string;
    }[];
    quantities: {
        itemId: number;
        personId: string;
        quantity: number;
    }[];
    serviceCharge: number;
    tipPercent: number;
    totals: {
        person: {
            id: string;
            name: string;
        };
        subtotal: number;
        service: number;
        tip: number;
        total: number;
    }[];
    name?: string | undefined;
    menuCode?: string | null | undefined;
}, {
    currency: string;
    items: {
        id: number;
        name: string;
        price: number;
        menuId?: number | undefined;
    }[];
    people: {
        id: string;
        name: string;
    }[];
    quantities: {
        itemId: number;
        personId: string;
        quantity: number;
    }[];
    serviceCharge: number;
    tipPercent: number;
    totals: {
        person: {
            id: string;
            name: string;
        };
        subtotal: number;
        service: number;
        tip: number;
        total: number;
    }[];
    name?: string | undefined;
    menuCode?: string | null | undefined;
}>;
export type Person = z.infer<typeof personSchema>;
export type ItemQuantity = z.infer<typeof itemQuantitySchema>;
export type PersonTotal = z.infer<typeof personTotalSchema>;
export type BillSplit = z.infer<typeof billSplitSchema>;
export type InsertBillSplit = z.infer<typeof insertBillSplitSchema>;
//# sourceMappingURL=schema.d.ts.map