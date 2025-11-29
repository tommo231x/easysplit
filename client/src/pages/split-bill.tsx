import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, X, Users, Calculator as CalculatorIcon, History, ChevronRight, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api";
import type { MenuItem, Person, ItemQuantity } from "@shared/schema";
import { nanoid } from "nanoid";
import CurrencySelector from "@/components/currency-selector";

export default function SplitBill() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [menuCode, setMenuCode] = useState("");
  const [loadedMenu, setLoadedMenu] = useState<MenuItem[] | null>(null);
  const [manualItems, setManualItems] = useState<MenuItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [quantities, setQuantities] = useState<ItemQuantity[]>([]);
  const [currency, setCurrency] = useState("£");
  const [serviceCharge, setServiceCharge] = useState(12.5);
  const [tipPercent, setTipPercent] = useState(0);
  const [splitName, setSplitName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setMenuCode(codeParam.toUpperCase());
    }

    // Restore form state from sessionStorage if user navigates back
    const savedState = sessionStorage.getItem("easysplit-form-state");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.manualItems) setManualItems(state.manualItems);
        if (state.people) setPeople(state.people);
        if (state.quantities) setQuantities(state.quantities);
        if (state.currency) setCurrency(state.currency);
        if (state.serviceCharge !== undefined) setServiceCharge(state.serviceCharge);
        if (state.tipPercent !== undefined) setTipPercent(state.tipPercent);
        if (state.splitName) setSplitName(state.splitName);
        if (state.menuCode) setMenuCode(state.menuCode);
        if (state.loadedMenu) setLoadedMenu(state.loadedMenu);
      } catch (e) {
        console.error("Failed to restore form state:", e);
      }
    }
  }, []);

  const { refetch: loadMenu, isFetching } = useQuery({
    queryKey: ["/api/menus", menuCode],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/menus/${menuCode}`));
      if (!response.ok) {
        throw new Error("Menu not found");
      }
      return response.json();
    },
    enabled: false,
    retry: false,
  });

  const { 
    data: splitHistory, 
    isError: splitHistoryError,
    isFetching: isFetchingHistory 
  } = useQuery<Array<{
    code: string;
    menuCode: string | null;
    people: Person[];
    totals: Array<{
      person: Person;
      subtotal: number;
      service: number;
      tip: number;
      total: number;
    }>;
    currency: string;
    createdAt: string;
  }>>({
    queryKey: ['/api/menus', menuCode, 'splits'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/menus/${menuCode}/splits`));
      if (!response.ok) {
        throw new Error('Failed to fetch split history');
      }
      return response.json();
    },
    enabled: !!loadedMenu && menuCode.length >= 6 && menuCode.length <= 8,
    retry: false,
  });

  const handleLoadMenu = async () => {
    if (!menuCode.trim()) {
      toast({
        title: "Enter menu code",
        description: "Please enter a menu code",
        variant: "destructive",
      });
      return;
    }

    const result = await loadMenu();
    if (result.data) {
      setLoadedMenu(result.data.items);
      setCurrency(result.data.menu.currency || "£");
      setManualItems([]);
      // Invalidate split history cache to trigger fresh fetch
      queryClient.invalidateQueries({
        queryKey: ['/api/menus', menuCode, 'splits']
      });
      toast({
        title: "Menu loaded!",
        description: `Loaded ${result.data.items.length} items`,
      });
    } else {
      toast({
        title: "Menu not found",
        description: "Please check the code and try again",
        variant: "destructive",
      });
    }
  };

  const addManualItem = () => {
    const newItem: MenuItem = {
      id: Date.now(),
      menuId: 0,
      name: "",
      price: 0,
    };
    setManualItems([...manualItems, newItem]);
    setLoadedMenu(null);
  };

  const updateManualItem = (id: number, field: "name" | "price", value: string | number) => {
    setManualItems(
      manualItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeManualItem = (id: number) => {
    setManualItems(manualItems.filter((item) => item.id !== id));
  };

  const addPerson = () => {
    if (!newPersonName.trim()) {
      toast({
        title: "Enter a name",
        description: "Please enter a person's name",
        variant: "destructive",
      });
      return;
    }

    const person: Person = {
      id: nanoid(),
      name: newPersonName.trim(),
    };
    setPeople([...people, person]);
    setNewPersonName("");
  };

  const removePerson = (id: string) => {
    setPeople(people.filter((p) => p.id !== id));
    setQuantities(quantities.filter((q) => q.personId !== id));
  };

  const getQuantity = (itemId: number, personId: string): number => {
    const q = quantities.find((q) => q.itemId === itemId && q.personId === personId);
    return q?.quantity || 0;
  };

  const updateQuantity = (itemId: number, personId: string, delta: number) => {
    const current = getQuantity(itemId, personId);
    const newQuantity = Math.max(0, current + delta);

    setQuantities((prev) => {
      const existing = prev.find((q) => q.itemId === itemId && q.personId === personId);
      if (existing) {
        if (newQuantity === 0) {
          return prev.filter((q) => !(q.itemId === itemId && q.personId === personId));
        }
        return prev.map((q) =>
          q.itemId === itemId && q.personId === personId
            ? { ...q, quantity: newQuantity }
            : q
        );
      } else if (newQuantity > 0) {
        return [...prev, { itemId, personId, quantity: newQuantity }];
      }
      return prev;
    });
  };

  const handleNewSplit = () => {
    // Clear all session storage
    sessionStorage.removeItem("easysplit-form-state");
    sessionStorage.removeItem("easysplit-split-code");
    sessionStorage.removeItem("easysplit-results");
    sessionStorage.removeItem("easysplit-results-state");
    
    // Reset all form state
    setMenuCode("");
    setLoadedMenu(null);
    setManualItems([]);
    setPeople([]);
    setNewPersonName("");
    setQuantities([]);
    setCurrency("£");
    setServiceCharge(12.5);
    setTipPercent(0);
    setSplitName("");
    
    toast({
      title: "New split started",
      description: "All fields have been cleared",
    });
  };

const handleCalculate = () => {
    const items = loadedMenu || manualItems;

    if (items.length === 0) {
      toast({
        title: "No items",
        description: "Please load a menu or add items manually",
        variant: "destructive",
      });
      return;
    }

    if (people.length === 0) {
      toast({
        title: "No people",
        description: "Please add at least one person",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter((item) => item.name && item.price > 0);
    if (validItems.length === 0) {
      toast({
        title: "Invalid items",
        description: "All items must have a name and price",
        variant: "destructive",
      });
      return;
    }

    // Clear any previous split code - this is a fresh calculation
    sessionStorage.removeItem("easysplit-split-code");
    
    // Save form state for back navigation
    sessionStorage.setItem(
      "easysplit-form-state",
      JSON.stringify({
        manualItems,
        people,
        quantities,
        currency,
        serviceCharge,
        tipPercent,
        splitName,
        menuCode: loadedMenu && menuCode ? menuCode : "",
        loadedMenu,
      })
    );
    
    // Save results data
    sessionStorage.setItem(
      "easysplit-results",
      JSON.stringify({
        items: validItems,
        people,
        quantities,
        currency,
        serviceCharge,
        tipPercent,
        menuCode: loadedMenu && menuCode ? menuCode : undefined,
        splitName: splitName.trim() || undefined,
      })
    );
    setLocation("/results");
  };

  const items = loadedMenu || manualItems;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold flex-1">Split Bill</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-new-split"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              New Split
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start a new split?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all current data including items, people, and calculations. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-new-split">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleNewSplit} data-testid="button-confirm-new-split">
                Start New Split
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step Guide */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">1</span>
              <span className="hidden sm:inline">Add items</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">2</span>
              <span className="hidden sm:inline">Add people</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">3</span>
              <span className="hidden sm:inline">Assign items</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted-foreground/30 text-muted-foreground flex items-center justify-center text-xs font-medium">4</span>
              <span className="hidden sm:inline">Calculate</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Label htmlFor="split-name" className="text-sm mb-2 block">
            Split Name <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="split-name"
            placeholder="e.g. 'Team Lunch' or 'Sarah's Birthday Dinner'"
            value={splitName}
            onChange={(e) => setSplitName(e.target.value)}
            className="h-12"
            data-testid="input-split-name"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Give your split a name so everyone knows what it's for when you share it
          </p>
        </Card>

        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" data-testid="tab-code">
              Load by Code
            </TabsTrigger>
            <TabsTrigger value="manual" data-testid="tab-manual">
              Add Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-4 mt-4">
            <Card className="p-6">
              <Label htmlFor="menu-code" className="text-sm mb-2 block">
                Enter Menu Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="menu-code"
                  placeholder="ABC12345"
                  value={menuCode}
                  onChange={(e) => setMenuCode(e.target.value.toUpperCase())}
                  className="h-12 font-mono text-lg"
                  maxLength={8}
                  data-testid="input-menu-code"
                />
                <Button
                  onClick={handleLoadMenu}
                  disabled={isFetching}
                  className="h-12"
                  data-testid="button-load-menu"
                >
                  {isFetching ? "Loading..." : "Load"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Manual Items</h3>
                <Button
                  onClick={addManualItem}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-manual-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {manualItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No items yet. Click "Add Item" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {manualItems.map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateManualItem(item.id, "name", e.target.value)}
                        className="h-12 flex-1"
                        data-testid={`input-manual-item-name-${item.id}`}
                      />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateManualItem(item.id, "price", parseFloat(e.target.value) || 0)
                        }
                        className="h-12 w-24"
                        step="0.01"
                        min="0"
                        data-testid={`input-manual-item-price-${item.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeManualItem(item.id)}
                        data-testid={`button-remove-manual-item-${item.id}`}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {loadedMenu && (
          <Collapsible defaultOpen>
            <Card className="p-6">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-auto p-0" 
                  data-testid="button-toggle-history"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <h3 className="font-medium">
                      Past Splits {splitHistory && splitHistory.length > 0 ? `(${splitHistory.length})` : ''}
                    </h3>
                  </div>
                  <ChevronRight className="h-5 w-5 transition-transform ui-state-open:rotate-90" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                {isFetchingHistory && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading history...
                  </div>
                )}
                {splitHistoryError && (
                  <div className="text-center py-4 text-sm text-destructive">
                    Unable to load split history
                  </div>
                )}
                {!isFetchingHistory && !splitHistoryError && (!splitHistory || splitHistory.length === 0) && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No past splits for this menu yet
                  </div>
                )}
                {!isFetchingHistory && !splitHistoryError && splitHistory && splitHistory.length > 0 && (
                  <div className="space-y-2">
                    {splitHistory.map((split) => {
                      const participantNames = split.people.map(p => p.name).join(", ");
                      const grandTotal = split.totals.reduce((sum, t) => sum + t.total, 0);
                      const date = new Date(split.createdAt);
                      
                      return (
                        <Link key={split.code} href={`/split/${split.code}`} data-testid={`link-split-${split.code}`}>
                          <Card className="p-4 hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-split-${split.code}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                    {split.code}
                                  </code>
                                  <span className="text-xs text-muted-foreground">
                                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {participantNames}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold" data-testid={`text-split-total-${split.code}`}>
                                  {split.currency}{grandTotal.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {split.people.length} {split.people.length === 1 ? 'person' : 'people'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="font-medium">People</h3>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
              className="h-12 flex-1"
              data-testid="input-person-name"
            />
            <Button onClick={addPerson} className="h-12" data-testid="button-add-person">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <Badge
                  key={person.id}
                  variant="secondary"
                  className="px-4 py-2 text-base rounded-full"
                  data-testid={`badge-person-${person.id}`}
                >
                  {person.name}
                  <button
                    onClick={() => removePerson(person.id)}
                    className="ml-2 hover:opacity-70"
                    data-testid={`button-remove-person-${person.id}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {items.length > 0 && people.length > 0 && (
          <Card className="p-6">
            <h3 className="font-medium mb-4">Who had what?</h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency}
                        {item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {people.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between bg-muted/50 rounded-lg p-2 gap-2"
                      >
                        <span className="text-sm flex-1 min-w-0">{person.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => updateQuantity(item.id, person.id, -1)}
                            data-testid={`button-decrease-${item.id}-${person.id}`}
                          >
                            -
                          </Button>
                          <span
                            className="w-8 text-center font-mono font-medium"
                            data-testid={`text-quantity-${item.id}-${person.id}`}
                          >
                            {getQuantity(item.id, person.id) || "-"}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => updateQuantity(item.id, person.id, 1)}
                            data-testid={`button-increase-${item.id}-${person.id}`}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="font-medium mb-4">Calculation Settings</h3>
          <div className="space-y-4">
            <CurrencySelector 
              value={currency} 
              onChange={setCurrency}
              testId="select-currency"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service" className="text-sm mb-2 block">
                  Service (%)
                </Label>
                <Input
                  id="service"
                  type="number"
                  value={serviceCharge || ""}
                  onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-12"
                  step="0.5"
                  min="0"
                  data-testid="input-service-charge"
                />
              </div>
              <div>
                <Label htmlFor="tip" className="text-sm mb-2 block">
                  Tip (%)
                </Label>
                <Input
                  id="tip"
                  type="number"
                  value={tipPercent || ""}
                  onChange={(e) => setTipPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-12"
                  step="0.5"
                  min="0"
                  data-testid="input-tip-percent"
                />
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Sticky Calculate Button - with extra padding to prevent accidental clicks */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            onClick={handleCalculate}
            className="w-full h-14 text-base"
            data-testid="button-calculate"
          >
            <CalculatorIcon className="h-5 w-5 mr-2" />
            Calculate Split
          </Button>
        </div>
      </div>
    </div>
  );
}
