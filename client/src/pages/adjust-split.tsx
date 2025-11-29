import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenuItem, Person, ItemQuantity } from "@shared/schema";
import { nanoid } from "nanoid";

interface PersonWithContribution extends Person {
  extraContribution: number;
}

export default function AdjustSplit() {
  const [, params] = useRoute("/adjust-split/:code");
  const code = params?.code?.toUpperCase() || "";
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [people, setPeople] = useState<PersonWithContribution[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<ItemQuantity[]>([]);
  const [serviceCharge, setServiceCharge] = useState(12.5);
  const [tipPercent, setTipPercent] = useState(0);
  const [currency, setCurrency] = useState("£");
  const [menuCode, setMenuCode] = useState<string | null>(null);
  const [splitName, setSplitName] = useState<string | null>(null);
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);

  const { data: originalSplit, isLoading } = useQuery<{
    code: string;
    name?: string | null;
    menuCode: string | null;
    people: Person[];
    items: MenuItem[];
    quantities: ItemQuantity[];
    currency: string;
    serviceCharge: number;
    tipPercent: number;
  }>({
    queryKey: [`/api/splits/${code}`],
    enabled: code.length >= 6 && code.length <= 8,
    retry: false,
  });

  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);

  useEffect(() => {
    if (originalSplit) {
      const existingPeople = originalSplit.people.map((p) => ({
        ...p,
        extraContribution: 0,
      }));
      
      let personToFocus: string | null = null;
      
      // Check if we need to add a new person from view-split page
      const newPersonName = sessionStorage.getItem("easysplit-add-person-name");
      if (newPersonName) {
        // Only add if person doesn't already exist
        const nameExists = existingPeople.some(
          p => p.name.toLowerCase().trim() === newPersonName.toLowerCase().trim()
        );
        
        if (!nameExists) {
          const newPerson: PersonWithContribution = {
            id: nanoid(),
            name: newPersonName.trim(),
            extraContribution: 0,
          };
          existingPeople.push(newPerson);
          personToFocus = newPerson.id;
        }
        
        // Clear the session storage
        sessionStorage.removeItem("easysplit-add-person-name");
      }
      
      // Check if we need to scroll to an existing person
      const focusId = sessionStorage.getItem("easysplit-focus-person-id");
      if (focusId) {
        personToFocus = focusId;
        sessionStorage.removeItem("easysplit-focus-person-id");
      }
      
      setPeople(existingPeople);
      setItems(originalSplit.items);
      setQuantities(originalSplit.quantities);
      setServiceCharge(originalSplit.serviceCharge);
      setTipPercent(originalSplit.tipPercent);
      setCurrency(originalSplit.currency);
      setMenuCode(originalSplit.menuCode);
      setSplitName(originalSplit.name || null);
      
      // Set focus person ID after state is set
      if (personToFocus) {
        setFocusPersonId(personToFocus);
      }
    }
  }, [originalSplit]);
  
  // Scroll to focused person after people are set
  useEffect(() => {
    if (focusPersonId && people.length > 0) {
      // Find the index of the person to focus
      const personIndex = people.findIndex(p => p.id === focusPersonId);
      if (personIndex >= 0) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.querySelector(`[data-testid="card-person-${personIndex}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setFocusPersonId(null);
        }, 100);
      }
    }
  }, [focusPersonId, people]);

  const calculateTotals = () => {
    const totals = people.map((person) => {
      const personQuantities = quantities.filter((q) => q.personId === person.id);
      const subtotal = personQuantities.reduce((sum, q) => {
        const item = items.find((i) => i.id === q.itemId);
        return sum + (item ? item.price * q.quantity : 0);
      }, 0);

      const service = (subtotal * serviceCharge) / 100;
      const tip = (subtotal * tipPercent) / 100;
      const baseTotal = subtotal + service + tip;

      return {
        person,
        subtotal,
        service,
        tip,
        baseTotal,
        extraContribution: person.extraContribution,
      };
    });

    const totalExtraContributions = totals.reduce((sum, t) => sum + t.extraContribution, 0);
    
    const reductions = new Map<string, number>();
    totals.forEach((t) => reductions.set(t.person.id, 0));

    let remaining = totalExtraContributions;
    let activeRecipients = totals.filter((t) => t.extraContribution === 0);

    while (remaining > 0 && activeRecipients.length > 0) {
      const sharePerRecipient = remaining / activeRecipients.length;
      let redistributionNeeded = false;

      activeRecipients.forEach((recipient) => {
        const currentReduction = reductions.get(recipient.person.id) || 0;
        const remainingOwed = recipient.baseTotal - currentReduction;
        const actualReduction = Math.min(sharePerRecipient, remainingOwed);
        
        reductions.set(recipient.person.id, currentReduction + actualReduction);
        remaining -= actualReduction;

        if (actualReduction < sharePerRecipient) {
          redistributionNeeded = true;
        }
      });

      if (redistributionNeeded) {
        activeRecipients = activeRecipients.filter((recipient) => {
          const currentReduction = reductions.get(recipient.person.id) || 0;
          return currentReduction < recipient.baseTotal;
        });
      } else {
        break;
      }
    }

    const finalTotals = totals.map((t) => {
      let adjustedTotal = t.baseTotal;
      
      if (t.extraContribution > 0) {
        adjustedTotal += t.extraContribution;
      } else {
        const reduction = reductions.get(t.person.id) || 0;
        adjustedTotal -= reduction;
      }

      return {
        ...t,
        total: Math.max(0, adjustedTotal),
      };
    });

    return finalTotals;
  };

  const addPerson = () => {
    const newPerson: PersonWithContribution = {
      id: nanoid(),
      name: "",
      extraContribution: 0,
    };
    setPeople([...people, newPerson]);
  };
  
  const addItem = () => {
    if (!newItemName.trim() || !newItemPrice || parseFloat(newItemPrice) <= 0) {
      toast({
        title: "Invalid item",
        description: "Please enter a valid item name and price",
        variant: "destructive",
      });
      return;
    }
    
    const newItem: MenuItem = {
      id: Date.now(),
      menuId: 0,
      name: newItemName.trim(),
      price: parseFloat(newItemPrice),
    };
    
    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemPrice("");
    setShowAddItem(false);
    
    toast({
      title: "Item added",
      description: `${newItem.name} added to the bill`,
    });
  };

  const removePerson = (personId: string) => {
    setPeople(people.filter((p) => p.id !== personId));
    setQuantities(quantities.filter((q) => q.personId !== personId));
  };

  const updatePersonName = (personId: string, name: string) => {
    setPeople(people.map((p) => (p.id === personId ? { ...p, name } : p)));
  };

  const updateExtraContribution = (personId: string, amount: number) => {
    setPeople(people.map((p) => (p.id === personId ? { ...p, extraContribution: amount } : p)));
  };

  const updateQuantity = (personId: string, itemId: number, quantity: number) => {
    const existing = quantities.find((q) => q.personId === personId && q.itemId === itemId);
    
    if (existing) {
      if (quantity === 0) {
        setQuantities(quantities.filter((q) => !(q.personId === personId && q.itemId === itemId)));
      } else {
        setQuantities(
          quantities.map((q) =>
            q.personId === personId && q.itemId === itemId ? { ...q, quantity } : q
          )
        );
      }
    } else if (quantity > 0) {
      setQuantities([...quantities, { personId, itemId, quantity }]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totals = calculateTotals();
      
      const response = await apiRequest("PATCH", `/api/splits/${code}`, {
        name: splitName || undefined,
        menuCode,
        people: people.map((p) => ({ id: p.id, name: p.name })),
        items,
        quantities,
        currency,
        serviceCharge,
        tipPercent,
        totals: totals.map((t) => ({
          person: { id: t.person.id, name: t.person.name },
          subtotal: t.subtotal,
          service: t.service,
          tip: t.tip,
          total: t.total,
          extraContribution: t.extraContribution,
          baseTotal: t.baseTotal,
        })),
      });
      
      return await response.json();
    },
    onSuccess: (data: { code: string }) => {
      // Invalidate the split query cache immediately so view-split shows updated data
      queryClient.invalidateQueries({
        queryKey: [`/api/splits/${code}`],
      });
      
      toast({
        title: "Split updated!",
        description: "Everyone with the link will see your changes.",
      });
      
      const savedSplits = JSON.parse(localStorage.getItem("easysplit-my-splits") || "[]");
      if (!savedSplits.includes(code)) {
        savedSplits.unshift(code);
        localStorage.setItem("easysplit-my-splits", JSON.stringify(savedSplits));
      }
      
      sessionStorage.setItem("easysplit-split-code", code);
      sessionStorage.setItem("easysplit-results-state", JSON.stringify({
        items,
        people: people.map((p) => ({ id: p.id, name: p.name })),
        quantities,
        currency,
        serviceCharge,
        tipPercent,
        menuCode,
      }));
      
      navigate(`/split/${code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update split",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (people.some((p) => !p.name.trim())) {
      toast({
        title: "Missing names",
        description: "Please name all participants",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    const totalExtraContributions = totals.reduce((sum, t) => sum + t.extraContribution, 0);
    const recipientBaseTotals = totals
      .filter((t) => t.extraContribution === 0)
      .reduce((sum, t) => sum + t.baseTotal, 0);

    if (totalExtraContributions > recipientBaseTotals) {
      toast({
        title: "Excess contribution",
        description: `Extra contributions (${currency}${totalExtraContributions.toFixed(2)}) exceed what others owe (${currency}${recipientBaseTotals.toFixed(2)}). Please reduce the extra amount.`,
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
          <Link href={`/split/${code}`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Loading...</h1>
        </header>
      </div>
    );
  }

  if (!originalSplit) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Split Not Found</h1>
        </header>
      </div>
    );
  }

  const totals = calculateTotals();
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
        <Link href={`/split/${code}`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Edit Contributions</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Mobile-Friendly Instructions */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-center space-y-2">
            <h2 className="font-semibold text-lg">Edit Your Items</h2>
            <p className="text-sm text-muted-foreground">
              Use +/- buttons to mark what you ordered, then tap Save
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Split code: <span className="font-mono font-semibold">{code}</span>
            </p>
          </div>
        </Card>

        {/* Quick Actions - Add Person & Add Item */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={addPerson}
            className="w-full h-12"
            data-testid="button-add-person-top"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Person
          </Button>
          
          {/* Add Item Section - Right below Add Person */}
          <Card className="p-4">
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="w-full flex items-center justify-between text-left"
              data-testid="button-toggle-add-item"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Add Item</span>
              </div>
              {showAddItem ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            {showAddItem && (
              <div className="mt-4 space-y-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Add items that weren't on the original bill
                </p>
                <div>
                  <Label htmlFor="new-item-name">Item Name</Label>
                  <Input
                    id="new-item-name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., Side Salad"
                    data-testid="input-new-item-name"
                  />
                </div>
                <div>
                  <Label htmlFor="new-item-price">Price ({currency})</Label>
                  <Input
                    id="new-item-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0.00"
                    data-testid="input-new-item-price"
                  />
                </div>
                <Button
                  onClick={addItem}
                  variant="secondary"
                  className="w-full"
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Bill
                </Button>
              </div>
            )}
          </Card>
        </div>

        {people.map((person, personIndex) => {
          const personTotal = totals.find((t) => t.person.id === person.id);
          
          return (
            <Card key={person.id} className="p-6" data-testid={`card-person-${personIndex}`}>
              <div className="flex items-start gap-2 mb-4">
                <div className="flex-1">
                  <Label htmlFor={`name-${person.id}`}>Name</Label>
                  <Input
                    id={`name-${person.id}`}
                    value={person.name}
                    onChange={(e) => updatePersonName(person.id, e.target.value)}
                    placeholder="Enter name"
                    data-testid={`input-name-${personIndex}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePerson(person.id)}
                  disabled={people.length === 1}
                  className="mt-6"
                  data-testid={`button-remove-person-${personIndex}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-4">
                <Label className="text-sm font-semibold">Items</Label>
                {items.map((item) => {
                  const qty = quantities.find((q) => q.personId === person.id && q.itemId === item.id)?.quantity || 0;
                  
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1 text-sm">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency}{item.price.toFixed(2)}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={qty || ""}
                        onChange={(e) => updateQuantity(person.id, item.id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20"
                        data-testid={`input-quantity-${personIndex}-${item.id}`}
                      />
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                <Label htmlFor={`extra-${person.id}`} className="text-sm font-semibold flex items-center gap-2">
                  Add Extra / Round Up
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Want to cover a bit more? Enter an amount here. This will automatically lower everyone else's share.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{currency}</span>
                  <Input
                    id={`extra-${person.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={person.extraContribution || ""}
                    onChange={(e) => updateExtraContribution(person.id, parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="flex-1"
                    data-testid={`input-extra-${personIndex}`}
                  />
                </div>
              </div>

              {personTotal && (
                <>
                  <Separator className="my-3" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{currency}{personTotal.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service ({serviceCharge}%)</span>
                      <span>{currency}{personTotal.service.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
                      <span>{currency}{personTotal.tip.toFixed(2)}</span>
                    </div>
                    {personTotal.extraContribution > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Extra Contribution</span>
                        <span>+{currency}{personTotal.extraContribution.toFixed(2)}</span>
                      </div>
                    )}
                    {personTotal.extraContribution === 0 && totals.some((t) => t.extraContribution > 0) && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Reduction from others</span>
                        <span>-{currency}{(personTotal.baseTotal - personTotal.total).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-lg">{currency}{personTotal.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          );
        })}

        <Card className="p-6 bg-primary/5">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Grand Total</span>
            <span className="text-2xl font-bold" data-testid="text-grand-total">
              {currency}{grandTotal.toFixed(2)}
            </span>
          </div>
        </Card>
      </main>

      {/* Sticky Save Button - always visible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full h-14 text-base"
            data-testid="button-save"
          >
            <Save className="h-5 w-5 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
