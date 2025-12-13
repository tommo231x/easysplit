
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

interface AddItemDrawerProps {
    onAddItem: (name: string, price: number) => void;
    currency: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddItemDrawer({ onAddItem, currency, open, onOpenChange }: AddItemDrawerProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    const isControlled = open !== undefined;
    const finalOpen = isControlled ? open : internalOpen;
    const finalSetOpen = isControlled ? onOpenChange! : setInternalOpen;

    const handleSubmit = () => {
        if (!name || !price) return;
        const priceNum = parseFloat(price);
        if (isNaN(priceNum)) return;

        onAddItem(name, priceNum);
        setName("");
        setPrice("");
        finalSetOpen(false);
    };

    return (
        <Drawer open={finalOpen} onOpenChange={finalSetOpen}>
            {!isControlled && (
                <DrawerTrigger asChild>
                    <Button className="w-full h-12 text-lg font-medium shadow-sm hover:translate-y-[-1px] transition-transform">
                        <Plus className="mr-2 h-5 w-5" /> Add Item
                    </Button>
                </DrawerTrigger>
            )}
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Add Manual Item</DrawerTitle>
                        <DrawerDescription>Enter item details below.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-name">Item Name</Label>
                            <Input
                                id="item-name"
                                placeholder="e.g. Burger"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 text-lg"
                                ref={(input) => {
                                    if (input && finalOpen) {
                                        setTimeout(() => input.focus(), 150);
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item-price">Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                    {currency}
                                </span>
                                <Input
                                    id="item-price"
                                    type="number"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="pl-8 h-12 text-lg"
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                />
                            </div>
                        </div>
                        <Button onClick={handleSubmit} className="w-full h-12 text-lg">
                            Add Item
                        </Button>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
