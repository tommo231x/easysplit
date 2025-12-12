import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Users, Calculator as CalculatorIcon, FilePlus, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import type { Person, ItemQuantity, OrderItem } from "@shared/schema";
import { nanoid } from "nanoid";
import CurrencySelector from "@/components/currency-selector";
import { SplitEvenlyDialog } from "@/components/split-evenly-dialog";
import { AddItemDrawer } from "@/components/add-item-drawer";
import { AddPersonDrawer } from "@/components/add-person-drawer";
import { BillPersonCard } from "@/components/bill-person-card";
import { BrandLogo } from "@/components/brand-logo";

// API Helpers
async function saveSplit(data: any, code?: string) {
  const url = code ? `/api/splits/${code}` : "/api/splits";
  const method = code ? "PATCH" : "POST";

  const res = await fetch(getApiUrl(url), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to save split");
  return res.json();
}

export default function SplitBill() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State
  const [people, setPeople] = useState<Person[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]); // Rich Draft State
  const [currency, setCurrency] = useState("£");
  const [serviceCharge, setServiceCharge] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);
  const [splitName, setSplitName] = useState("");

  // UX State
  const [activePersonId, setActivePersonId] = useState<string | null>(null); // Who are we adding items for?
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [splitDialogItem, setSplitDialogItem] = useState<OrderItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => sessionStorage.getItem("easysplit-user-id"));

  useEffect(() => {
    if (currentUserId) {
      sessionStorage.setItem("easysplit-user-id", currentUserId);
    }
  }, [currentUserId]);

  // Collaboration State
  const [splitCode, setSplitCode] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);

  // Initialize / Restore
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("splitCode"); // "Join Table" link

    if (codeParam) {
      setSplitCode(codeParam);
      setIsShared(true);
      // Fetching handled by useQuery below
    } else {
      // Local Restore
      const savedState = sessionStorage.getItem("easysplit-form-state");
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.people) setPeople(state.people);
          if (state.orderItems) setOrderItems(state.orderItems);
          if (state.currency) setCurrency(state.currency);
          if (state.splitName) setSplitName(state.splitName);
          if (state.serviceCharge !== undefined) setServiceCharge(state.serviceCharge);
          if (state.tipPercent !== undefined) setTipPercent(state.tipPercent);
        } catch (e) {
          console.error("Failed to restore state", e);
        }
      }
    }
  }, []);

  // Persist Local State (debouncedish via effect)
  useEffect(() => {
    if (!splitCode) {
      const state = { people, orderItems, currency, splitName, serviceCharge, tipPercent };
      sessionStorage.setItem("easysplit-form-state", JSON.stringify(state));
    }
  }, [people, orderItems, currency, splitName, serviceCharge, tipPercent, splitCode]);

  // POLL for updates if Shared
  const { data: serverSplit } = useQuery({
    queryKey: ["split", splitCode],
    queryFn: async () => {
      if (!splitCode) return null;
      const res = await fetch(getApiUrl(`/api/splits/${splitCode}`));
      if (!res.ok) throw new Error("Failed to load split");
      return res.json();
    },
    enabled: !!splitCode && isShared,
    refetchInterval: 3000, // Poll every 3s
  });

  // Sync Server State -> Local State
  useEffect(() => {
    if (serverSplit) {
      // 1. Sync People
      // We use stringify for simple deep compare of the array
      if (JSON.stringify(serverSplit.people) !== JSON.stringify(people)) {
        setPeople(serverSplit.people);
      }

      // 2. Sync Draft Data (Order Items)
      // This is the CRITICAL part for syncing splits between Tom and Dave
      if (serverSplit.draftData) {
        try {
          const draft = JSON.parse(serverSplit.draftData);
          // Compare current local items with server items
          if (JSON.stringify(draft.orderItems) !== JSON.stringify(orderItems)) {
            console.log("Syncing external changes...", draft.orderItems);
            setOrderItems(draft.orderItems);
          }
        } catch (e) { console.error("Draft parse error", e); }
      }

      // 3. Sync Meta
      if (serverSplit.name !== splitName && serverSplit.name) setSplitName(serverSplit.name);
      if (serverSplit.currency !== currency && serverSplit.currency) setCurrency(serverSplit.currency);
    }
  }, [serverSplit]);


  // Auto-Save Changes if Shared
  const saveMutation = useMutation({
    mutationFn: (data: any) => saveSplit(data, splitCode || undefined),
    onSuccess: (data) => {
      if (!splitCode && data.code) {
        setSplitCode(data.code);
        setIsShared(true);
        // Update URL without reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("splitCode", data.code);
        window.history.pushState({}, "", newUrl);
        toast({ title: "Session Created", description: "You can now share the link!" });
      }
    }
  });

  // Central Save Trigger
  const triggerSave = () => {
    if (!isShared) return; // Only auto-save if already shared

    // Construct the "Draft" payload
    const payload = {
      name: splitName,
      people,
      // Hack to satisfy "min(1)" constraint for legacy schema
      items: orderItems.length > 0
        ? orderItems.map((i, idx) => ({ id: idx + 1, name: i.name, price: i.price }))
        : [{ id: 0, name: "_draft", price: 0 }],
      quantities: orderItems.length > 0
        ? [{ itemId: 1, personId: people[0]?.id || "0", quantity: 1 }]
        : [{ itemId: 0, personId: "0", quantity: 1 }],
      totals: [{ person: { id: "0", name: "Draft" }, subtotal: 0, service: 0, tip: 0, total: 0 }], // Dummy

      // THE REAL DATA:
      draftData: JSON.stringify({ orderItems }),

      currency,
      serviceCharge,
      tipPercent
    };

    saveMutation.mutate(payload);
  };

  // Call triggerSave on significant changes
  useEffect(() => {
    if (isShared) {
      const timeout = setTimeout(triggerSave, 1000); // Debounce 1s
      return () => clearTimeout(timeout);
    }
  }, [people, orderItems, splitName, currency]);


  // Real-Time Calculation Hook
  const calculatedTotals = useMemo(() => {
    return people.map(person => {
      let subtotal = 0;
      orderItems.forEach(item => {
        const assignees = item.assignedTo || [];
        if (assignees.includes(person.id)) {
          const count = assignees.length || 1;
          subtotal += item.price / count;
        }
      });

      const serviceAmt = subtotal * (serviceCharge / 100);
      const tipAmt = subtotal * (tipPercent / 100);

      return {
        personId: person.id,
        subtotal,
        service: serviceAmt,
        tip: tipAmt,
        total: subtotal + serviceAmt + tipAmt
      };
    });
  }, [people, orderItems, serviceCharge, tipPercent]);

  // Actions
  const handleAddPerson = (name: string) => {
    const newPerson = { id: nanoid(), name };
    setPeople([...people, newPerson]);

    // Auto-claim identity if first person or unclaimed
    if (!currentUserId) {
      setCurrentUserId(newPerson.id);
    }
  };

  const handleRemovePerson = (id: string) => {
    // 1. Remove the person
    setPeople(prev => prev.filter(p => p.id !== id));

    // 2. Remove items OWNED by this person
    setOrderItems(prev => {
      // First filter out owned items
      const remainingItems = prev.filter(i => i.ownerId !== id);

      // 3. Remove this person from assignedTo in ALL other items
      return remainingItems.map(item => {
        if (item.assignedTo.includes(id)) {
          const newAssigned = item.assignedTo.filter(pid => pid !== id);
          return {
            ...item,
            // If they were the only one assigned, revert to owner or empty? 
            // Logic: If assignedTo becomes empty, default back to ownerId if exists, otherwise leave empty (unassigned)
            assignedTo: newAssigned.length > 0 ? newAssigned : (item.ownerId && item.ownerId !== id ? [item.ownerId] : [])
          };
        }
        return item;
      });
    });
  };

  const handleManualAddItem = (name: string, price: number) => {
    if (!activePersonId) return;

    const newItem: OrderItem = {
      instanceId: nanoid(),
      originalId: 0, // Manual
      name,
      price,
      ownerId: activePersonId,
      assignedTo: [activePersonId],
    };

    setOrderItems(prev => [...prev, newItem]);
    setIsAddItemOpen(false); // Close drawer
  };

  const handleSplitItem = (instanceId: string, assignedIds: string[]) => {
    setOrderItems(prev => prev.map(item =>
      item.instanceId === instanceId
        ? { ...item, assignedTo: assignedIds }
        : item
    ));
  };



  const handleCloseBill = async () => {
    if (people.length === 0 || orderItems.length === 0) {
      toast({ title: "Nothing to split", variant: "destructive" });
      return;
    }

    if (!confirm("Are you sure you want to close this bill? This will save it to history.")) {
      return;
    }

    // 2. Prepare Payload (Map Instances -> Bill Items)
    const billItems = orderItems.map((item, idx) => ({
      id: idx + 1,
      name: item.name,
      price: item.price
    }));

    const billQuantities: ItemQuantity[] = orderItems.flatMap((item, idx) => {
      const itemId = idx + 1;
      const count = item.assignedTo.length;
      return item.assignedTo.map(personId => ({
        itemId,
        personId,
        quantity: Number((1 / count).toFixed(4))
      }));
    });

    // Remap calculatedTotals to the format expected by the backend
    const finalTotals = calculatedTotals.map(t => {
      const person = people.find(p => p.id === t.personId);
      return {
        person: person || { id: "0", name: "Unknown" },
        subtotal: t.subtotal,
        service: t.service,
        tip: t.tip,
        total: t.total
      };
    });

    const payload = {
      name: splitName || "Untitled Split",
      people,
      items: billItems,
      quantities: billQuantities,
      totals: finalTotals,
      currency,
      serviceCharge,
      tipPercent,
      draftData: JSON.stringify({ orderItems })
    };

    try {
      const result = await saveSplit(payload, splitCode || undefined);

      // Save to local history immediately (Strings only, matching my-splits.tsx expectation)
      try {
        const history: string[] = JSON.parse(localStorage.getItem("easysplit-my-splits") || "[]");
        // Dedupe: remove if exists
        const filtered = history.filter((c: string) => c !== result.code);
        // Prepend and cap at 50
        const newHistory = [result.code, ...filtered].slice(0, 50);
        localStorage.setItem("easysplit-my-splits", JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save to local history", e);
      }

      setLocation(`/results?splitCode=${result.code}`);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save split", variant: "destructive" });
    }
  };

  const handleShare = () => {
    setIsShared(true);
    triggerSave(); // Forces a save to generate code
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "Send this to your friends!" });
  };

  const handleStartOver = () => {
    if (confirm("Start over?")) {
      setPeople([]);
      setOrderItems([]);
      setSplitCode(null);
      setIsShared(false);
      setSplitName("");
      window.history.pushState({}, "", "/split-bill");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b-2 border-black h-16 flex items-center px-4 justify-between brutal-shadow-sm mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <BrandLogo />
        </div>
        <div className="flex gap-2">
          {/* Clean Header Actions */}
          <Button variant="ghost" size="icon" onClick={() => setIsShared(true)} className={isShared ? "text-green-600 bg-green-50" : "text-muted-foreground"}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleStartOver} className="hover:text-destructive"><FilePlus className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 pb-32">

        {/* Sync/Share Status */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex flex-col items-center text-center gap-3">
          {!splitCode ? (
            <>
              <div className="bg-primary/10 p-3 rounded-full"><Share2 className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="font-medium text-sm">Dining with friends?</h3>
                <p className="text-xs text-muted-foreground mt-1">Share a live link so everyone can add their own items.</p>
              </div>
              <Button size="sm" onClick={handleShare} className="w-full">Create Live Session</Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <span className="relative flex h-2.5 w-2.5 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Live Session Active
              </div>
              <div className="flex w-full gap-2">
                <Input readOnly value={window.location.href} className="text-xs h-8" />
                <Button size="icon" className="h-8 w-8 shrink-0" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>

        {/* Split Name Input */}
        <div className="bg-white p-4 border-2 border-black brutal-shadow rounded-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-200">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">What are we eating?</Label>
          <Input
            placeholder="e.g. Sushi Night 🍣"
            className="text-2xl font-black border-none px-0 focus-visible:ring-0 placeholder:font-bold placeholder:text-muted-foreground/30 bg-transparent h-auto"
            value={splitName}
            onChange={e => setSplitName(e.target.value)}
          />
        </div>

        {/* Global Settings (Compact) */}
        <div className="flex gap-4">
          <div className="flex-1 bg-white p-3 border-2 border-black rounded-xl shadow-sm">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Service %</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={serviceCharge === 0 ? "" : serviceCharge}
              onChange={e => {
                const val = e.target.value;
                if (val === "") {
                  setServiceCharge(0);
                  return;
                }
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setServiceCharge(num);
                }
              }}
              className="h-8 border-black font-bold text-lg"
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
              Check if included by restaurant.
            </p>
          </div>
          <div className="bg-white p-3 border-2 border-black rounded-xl shadow-sm w-1/3">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Currency</Label>
            <CurrencySelector value={currency} onChange={setCurrency} />
          </div>
        </div>

        {/* People & Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end pb-2 border-b">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Orders</Label>
            <span className="text-xs text-muted-foreground">{people.length} people</span>
          </div>

          {people.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">Add the first person to start ordering.</p>
              <div className="mt-4">
                <AddPersonDrawer onAddPerson={handleAddPerson} trigger={<Button>Add Person</Button>} />
              </div>
            </div>
          ) : (
            <>
              {people.map(person => {
                const totals = calculatedTotals.find(t => t.personId === person.id);
                return (
                  <BillPersonCard
                    key={person.id}
                    person={person}
                    items={orderItems.filter(i => i.ownerId === person.id || i.assignedTo.includes(person.id))}
                    currency={currency}
                    isCurrentUser={person.id === currentUserId}
                    subtotal={totals?.subtotal}
                    total={totals?.total}
                    onAddItem={() => {
                      setActivePersonId(person.id);
                      setIsAddItemOpen(true);
                    }}
                    onRemoveItem={(id) => setOrderItems(o => o.filter(i => i.instanceId !== id))}
                    onRemovePerson={() => handleRemovePerson(person.id)}
                    onSplitItem={(item) => setSplitDialogItem(item)}
                  />
                )
              })}

              <div className="pt-2 flex justify-center">
                <AddPersonDrawer onAddPerson={handleAddPerson} />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Sticky Footer for Total & Close */}
      {people.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-4 pb-8 brutal-shadow z-20">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Grand Total</span>
              <div className="text-3xl font-black leading-none">
                {currency}
                {(calculatedTotals.reduce((sum, t) => sum + t.total, 0)).toFixed(2)}
              </div>
            </div>
            <Button size="lg" className="flex-1 h-12 text-lg font-bold bg-black text-white hover:bg-primary hover:scale-[1.02] transition-transform brutal-shadow-sm" onClick={handleCloseBill}>
              Close Bill <CalculatorIcon className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Drawers & Dialogs */}
      <AddItemDrawer
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        onAddItem={handleManualAddItem}
        currency={currency}
      />

      {
        splitDialogItem && (
          <SplitEvenlyDialog
            isOpen={!!splitDialogItem}
            onOpenChange={(open) => !open && setSplitDialogItem(null)}
            itemName={splitDialogItem.name}
            people={people}
            initialSelectedIds={splitDialogItem.assignedTo}
            onConfirm={(ids) => {
              handleSplitItem(splitDialogItem.instanceId, ids);
            }}
          />
        )
      }
    </div >
  );
}
