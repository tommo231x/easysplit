import { Link } from "wouter";
import { ArrowLeft, Copy, Check, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenuItem, Person, ItemQuantity, PersonTotal } from "@shared/schema";

interface ResultsState {
  items: MenuItem[];
  people: Person[];
  quantities: ItemQuantity[];
  currency: string;
  serviceCharge: number;
  tipPercent: number;
  menuCode?: string;
  persistedTotals?: PersonTotal[];
}

export default function Results() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [state, setState] = useState<ResultsState | null>(null);
  const [splitCode, setSplitCode] = useState<string | null>(null);

  const savedSplitCode = sessionStorage.getItem("easysplit-split-code");
  
  // If there's a saved split code but no state, fetch the split from API
  const { data: savedSplit } = useQuery<{
    code: string;
    menuCode: string | null;
    people: Person[];
    items: MenuItem[];
    quantities: ItemQuantity[];
    currency: string;
    serviceCharge: number;
    tipPercent: number;
    totals: PersonTotal[];
    createdAt: string;
  }>({
    queryKey: [`/api/splits/${savedSplitCode}`],
    enabled: !!savedSplitCode && !state,
    retry: false,
  });

  useEffect(() => {
    const sessionData = sessionStorage.getItem("easysplit-results");
    if (sessionData) {
      setState(JSON.parse(sessionData));
      sessionStorage.removeItem("easysplit-results");
    }
    
    // Restore saved split code if it exists
    const savedCode = sessionStorage.getItem("easysplit-split-code");
    if (savedCode) {
      setSplitCode(savedCode);
    }
  }, []);
  
  // If we loaded a saved split, populate state from it
  useEffect(() => {
    if (savedSplit && !state) {
      setState({
        items: savedSplit.items,
        people: savedSplit.people,
        quantities: savedSplit.quantities,
        currency: savedSplit.currency,
        serviceCharge: savedSplit.serviceCharge,
        tipPercent: savedSplit.tipPercent,
        menuCode: savedSplit.menuCode || undefined,
        persistedTotals: savedSplit.totals,
      });
    }
  }, [savedSplit, state]);

  const saveSplitMutation = useMutation({
    mutationFn: async (data: {
      menuCode?: string;
      people: Person[];
      items: MenuItem[];
      quantities: ItemQuantity[];
      currency: string;
      serviceCharge: number;
      tipPercent: number;
      totals: PersonTotal[];
    }) => {
      const response = await apiRequest("POST", "/api/splits", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSplitCode(data.code);
      sessionStorage.setItem("easysplit-split-code", data.code);
      
      // Track this split in localStorage
      const savedSplits = JSON.parse(localStorage.getItem("easysplit-my-splits") || "[]");
      if (!savedSplits.includes(data.code)) {
        savedSplits.unshift(data.code);
        localStorage.setItem("easysplit-my-splits", JSON.stringify(savedSplits));
        
        // Invalidate My Splits query so it updates if the page is open
        queryClient.invalidateQueries({
          queryKey: ['/api/splits/batch']
        });
      }
      
      toast({
        title: "Split saved!",
        description: "Your bill split has been saved and can be shared",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save split",
        variant: "destructive",
      });
    },
  });

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No calculation data found</p>
          <Link href="/split-bill">
            <Button>Go to Split Bill</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { items, people, quantities, currency, serviceCharge, tipPercent, menuCode, persistedTotals } = state;

  const calculateTotals = (): PersonTotal[] => {
    // If we have persisted totals, use them instead of recalculating
    if (persistedTotals) {
      return persistedTotals;
    }
    
    return people.map((person) => {
      let subtotal = 0;

      quantities
        .filter((q) => q.personId === person.id)
        .forEach((q) => {
          const item = items.find((i) => i.id === q.itemId);
          if (item) {
            subtotal += item.price * q.quantity;
          }
        });

      const service = (subtotal * serviceCharge) / 100;
      const tip = (subtotal * tipPercent) / 100;
      const total = subtotal + service + tip;

      return {
        person,
        subtotal: Math.round(subtotal * 100) / 100,
        service: Math.round(service * 100) / 100,
        tip: Math.round(tip * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
    });
  };

  const totals = calculateTotals();
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  const handleSaveSplit = () => {
    saveSplitMutation.mutate({
      menuCode,
      people,
      items,
      quantities,
      currency,
      serviceCharge,
      tipPercent,
      totals,
    });
  };

  const shareLink = async () => {
    if (!splitCode) return;
    
    const url = `${window.location.origin}/split/${splitCode}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Bill Split",
          text: "Check out our bill split",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
      }
    } catch (err) {
      // User cancelled share
    }
  };

  const copyBreakdown = async () => {
    let text = "Bill Split Breakdown\n";
    text += "=".repeat(30) + "\n\n";

    totals.forEach((t) => {
      text += `${t.person.name}\n`;
      
      // Add itemized list
      const personItems = quantities
        .filter((q) => q.personId === t.person.id)
        .map((q) => {
          const item = items.find((i) => i.id === q.itemId);
          return { ...q, item: item! };
        })
        .filter((q) => q.item);
      
      personItems.forEach((pItem) => {
        text += `  ${pItem.quantity}x ${pItem.item.name} - ${currency}${(pItem.item.price * pItem.quantity).toFixed(2)}\n`;
      });
      
      if (personItems.length > 0) {
        text += `  ---\n`;
      }
      
      text += `  Subtotal: ${currency}${t.subtotal.toFixed(2)}\n`;
      if (t.service > 0) {
        text += `  Service (${serviceCharge}%): ${currency}${t.service.toFixed(2)}\n`;
      }
      if (t.tip > 0) {
        text += `  Tip (${tipPercent}%): ${currency}${t.tip.toFixed(2)}\n`;
      }
      text += `  Total: ${currency}${t.total.toFixed(2)}\n\n`;
    });

    text += "=".repeat(30) + "\n";
    text += `Grand Total: ${currency}${grandTotal.toFixed(2)}\n`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Breakdown copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
        <Link href="/split-bill">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Results</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          {totals.map((personTotal) => {
            const personItems = quantities
              .filter((q) => q.personId === personTotal.person.id)
              .map((q) => {
                const item = items.find((i) => i.id === q.itemId);
                return {
                  ...q,
                  item: item!,
                };
              })
              .filter((q) => q.item);

            return (
              <Card key={personTotal.person.id} className="p-6" data-testid={`card-person-${personTotal.person.id}`}>
                <h3 className="text-xl font-semibold mb-4">{personTotal.person.name}</h3>
                
                {personItems.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {personItems.map((pItem, idx) => (
                      <div key={idx} className="flex justify-between gap-2 text-sm" data-testid={`item-${personTotal.person.id}-${idx}`}>
                        <span className="text-muted-foreground">
                          {pItem.quantity}x {pItem.item.name}
                        </span>
                        <span className="font-mono">
                          {currency}{(pItem.item.price * pItem.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <Separator className="my-3" />
                
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid={`text-subtotal-${personTotal.person.id}`}>
                      {currency}
                      {personTotal.subtotal.toFixed(2)}
                    </span>
                  </div>
                {personTotal.service > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Service ({serviceCharge}%)
                    </span>
                    <span data-testid={`text-service-${personTotal.person.id}`}>
                      {currency}
                      {personTotal.service.toFixed(2)}
                    </span>
                  </div>
                )}
                {personTotal.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip ({tipPercent}%)</span>
                    <span data-testid={`text-tip-${personTotal.person.id}`}>
                      {currency}
                      {personTotal.tip.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span data-testid={`text-total-${personTotal.person.id}`}>
                    {currency}
                    {personTotal.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        <Card className="p-6 bg-primary text-primary-foreground">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Grand Total</span>
            <span className="text-2xl font-bold font-mono" data-testid="text-grand-total">
              {currency}
              {grandTotal.toFixed(2)}
            </span>
          </div>
        </Card>

        {splitCode && (
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Shareable link:</span>
              <code className="flex-1 font-mono text-xs bg-background px-2 py-1 rounded border" data-testid="text-split-link">
                {window.location.origin}/split/{splitCode}
              </code>
            </div>
          </Card>
        )}

        <div className="flex gap-2">
          <Button
            onClick={copyBreakdown}
            variant="outline"
            className="flex-1"
            data-testid="button-copy-breakdown"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Breakdown
              </>
            )}
          </Button>
          
          {!splitCode ? (
            <Button
              onClick={handleSaveSplit}
              disabled={saveSplitMutation.isPending}
              className="flex-1"
              data-testid="button-save-split"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {saveSplitMutation.isPending ? "Saving..." : "Save & Share"}
            </Button>
          ) : (
            <Button
              onClick={shareLink}
              className="flex-1"
              data-testid="button-share-link"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
