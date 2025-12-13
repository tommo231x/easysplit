
import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
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

interface AddPersonDrawerProps {
    onAddPerson: (name: string) => void;
    trigger?: React.ReactNode;
}

export function AddPersonDrawer({ onAddPerson, trigger }: AddPersonDrawerProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAddPerson(name);
        setName("");
        setOpen(false);
    };

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" className="h-10 border-dashed border-2">
                        <UserPlus className="mr-2 h-4 w-4" /> Add Person
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Add Person</DrawerTitle>
                        <DrawerDescription>Who is sharing this bill?</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="person-name">Name</Label>
                            <Input
                                id="person-name"
                                placeholder="e.g. Tom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 text-lg"
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                ref={(input) => {
                                    if (input && open) {
                                        setTimeout(() => input.focus(), 150);
                                    }
                                }}
                            />
                        </div>
                        <Button onClick={handleSubmit} className="w-full h-12 text-lg">
                            Add Person
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
