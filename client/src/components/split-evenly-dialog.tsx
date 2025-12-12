import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, Check } from "lucide-react";
import type { Person } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SplitEvenlyDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    people: Person[];
    initialSelectedIds?: string[];
    onConfirm: (selectedPersonIds: string[]) => void;
}

export function SplitEvenlyDialog({
    isOpen,
    onOpenChange,
    itemName,
    people,
    initialSelectedIds = [],
    onConfirm,
}: SplitEvenlyDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Reset selection when opening
    useEffect(() => {
        if (isOpen) {
            // If we have existing assignments (and it's not empty), use them.
            // If initialSelectedIds is passed but empty, it might mean "nobody assigned yet".
            // However, for "Split Evenly", the user usually wants to select people.
            // If it's a NEW split (actually, usually valid assignments > 0), use them.
            // If 0 assignments, default to ALL.
            if (initialSelectedIds && initialSelectedIds.length > 0) {
                setSelectedIds(initialSelectedIds);
            } else {
                setSelectedIds(people.map(p => p.id));
            }
        }
    }, [isOpen, people, initialSelectedIds]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === people.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(people.map(p => p.id));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Split "{itemName}"</DialogTitle>
                    <DialogDescription>
                        Select who shared this item. The cost will be divided equally (1/{selectedIds.length}).
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm text-muted-foreground">
                            {selectedIds.length} of {people.length} selected
                        </Label>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8">
                                {selectedIds.length === people.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-[200px] pr-4 border rounded-md p-2">
                        <div className="space-y-2">
                            {people.map((person) => (
                                <div
                                    key={person.id}
                                    className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer select-none"
                                    onClick={() => handleToggle(person.id)}
                                >
                                    <Checkbox
                                        id={`person-${person.id}`}
                                        checked={selectedIds.includes(person.id)}
                                        // pointer-events-none prevents the checkbox from determining click, 
                                        // letting the parent div handle the click.
                                        className="pointer-events-none"
                                    />
                                    <Label
                                        htmlFor={`person-${person.id}`}
                                        className="flex-1 cursor-pointer font-medium pointer-events-none"
                                    >
                                        {person.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                    <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm(selectedIds);
                            onOpenChange(false);
                        }}
                        disabled={selectedIds.length === 0}
                        className="w-full sm:w-auto"
                    >
                        Confirm Split ({selectedIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
