import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MenuItem } from "@shared/schema";

// We need a simplified interface here if we don't want to import the local OrderItem type
// But we can just pass the necessary data
interface SharedItemSummary {
    instanceId: string;
    name: string;
    price: number;
    currentSharers: number;
}

interface JoinSharedItemsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    newPersonName: string;
    sharedItems: SharedItemSummary[];
    onConfirm: (selectedInstanceIds: string[]) => void;
    onSkip: () => void;
}

export function JoinSharedItemsDialog({
    isOpen,
    onOpenChange,
    newPersonName,
    sharedItems,
    onConfirm,
    onSkip
}: JoinSharedItemsDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Default to selecting ALL shared items? Or NONE?
    // Probably selecting text implies recommendation. Let's select all by default for convenience if it's "Team split".
    // But maybe safer to select none. Let's select ALL for fluid UX.
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(sharedItems.map(i => i.instanceId));
        }
    }, [isOpen, sharedItems]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Join Existing Splits?</DialogTitle>
                    <DialogDescription>
                        There are items already being shared. Do you want <strong>{newPersonName}</strong> to join in?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <ScrollArea className="h-[200px] pr-4 border rounded-md p-2 bg-muted/20">
                        <div className="space-y-2">
                            {sharedItems.map((item) => (
                                <div key={item.instanceId} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleToggle(item.instanceId)}>
                                    <Checkbox
                                        checked={selectedIds.includes(item.instanceId)}
                                        onCheckedChange={() => handleToggle(item.instanceId)}
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Currently shared by {item.currentSharers} people
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                    <Button variant="ghost" onClick={onSkip} className="w-full sm:w-auto">
                        Skip
                    </Button>
                    <Button
                        onClick={() => onConfirm(selectedIds)}
                        className="w-full sm:w-auto"
                    >
                        Join {selectedIds.length} {selectedIds.length === 1 ? "Split" : "Splits"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
