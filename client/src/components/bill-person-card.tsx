import { Plus, Trash2, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Person, OrderItem } from "@shared/schema";

interface BillPersonCardProps {
    person: Person;
    items: OrderItem[];
    currency: string;
    isCurrentUser: boolean;
    onAddItem: () => void;
    onRemoveItem: (instanceId: string) => void;
    onSplitItem: (item: OrderItem) => void;
    onRemovePerson: () => void;
    subtotal?: number;
    total?: number;
    tipService?: number;
}

export function BillPersonCard({
    person,
    items,
    currency,
    isCurrentUser,
    onAddItem,
    onRemoveItem,
    onSplitItem,
    onRemovePerson,
    subtotal,
    total
}: BillPersonCardProps) {

    return (
        <Card className={`p-5 mb-6 border-2 border-black brutal-shadow overflow-hidden bg-white relative transition-all duration-200 hover:-translate-y-1 ${isCurrentUser ? "ring-2 ring-primary ring-offset-2" : ""}`}>
            {/* Colored Banner for Visual Distinction */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${isCurrentUser ? "bg-primary" : "bg-muted-foreground/20"}`} />

            <div className="flex justify-between items-end mb-4 mt-2">
                <div>
                    {isCurrentUser && <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5 block">That's You</span>}
                    <h3 className="font-heading text-2xl leading-none">{person.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {total !== undefined && (
                        <div className="text-right bg-black text-white px-3 py-1 rounded-lg shadow-sm transform rotate-1">
                            <span className="block font-black text-xl leading-none">{currency}{total.toFixed(2)}</span>
                        </div>
                    )}
                    {items.length === 0 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemovePerson}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-2 mb-3">
                {items.map(item => {
                    const isShared = item.assignedTo.length > 1;
                    const shareCount = item.assignedTo.length || 1;
                    const effectivePrice = item.price / shareCount;
                    const isOwner = item.ownerId === person.id;
                    const shareText = isShared ? `Split ${shareCount}-way` : "";

                    return (
                        <div key={item.instanceId} className="flex justify-between items-center p-3 mb-2 bg-muted/30 rounded-lg border border-transparent hover:border-black/5 transition-colors">
                            <div className="flex-1">
                                <div className="font-bold text-base flex items-center gap-2">
                                    {item.name}
                                    {isShared && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-accent text-black border-black/20">
                                            {shareText}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium flex gap-2">
                                    <span>{currency}{effectivePrice.toFixed(2)}</span>
                                    {isShared && <span className="opacity-40 line-through text-xs pt-0.5">{currency}{item.price.toFixed(2)}</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm border border-black/10"
                                    onClick={() => onSplitItem(item)}
                                    title="Split Item"
                                >
                                    <Split className="h-3 w-3 mr-1" /> Split
                                </Button>
                                {isOwner && (
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.instanceId)} title="Remove Item">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && (
                    <div className="text-sm text-muted-foreground italic py-3 text-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                        No items ordered yet.
                    </div>
                )}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary hover:bg-primary/5 h-12 text-base font-medium transition-all"
                onClick={onAddItem}
            >
                <Plus className="h-5 w-5 mr-2" />
                Add Item
            </Button>
        </Card >
    );
}
