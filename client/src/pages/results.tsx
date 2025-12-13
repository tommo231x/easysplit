import { Link, useLocation } from "wouter";
import { ArrowLeft, Copy, Check, Share2, Edit, UserPlus, Link as LinkIcon, CheckCircle2, XCircle, MoreVertical, FileText } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenuItem, Person, ItemQuantity, PersonTotal } from "@shared/schema";
import { setSplitStatus, getSplitStatus } from "@/lib/split-status";
import { logAnalyticsEvent, AnalyticsEvents } from "@/lib/analytics";
import { Drawer } from "vaul";

interface ResultsState {
  items: MenuItem[];
  people: Person[];
  quantities: ItemQuantity[];
  currency: string;
  serviceCharge: number;
  tipPercent: number;
  menuCode?: string;
  splitName?: string;
  persistedTotals?: PersonTotal[];
}

// Helper for Quantity Display
// User Request: "Hide the logic" - only show explicit multiples
function formatQuantity(q: number): string {
  if (q > 1.01) {
    // Show integers or significant multiples (e.g. 2x, 1.5x)
    return `${parseFloat(q.toFixed(2))}x`;
  }
  return "";
}

export default function Results() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [state, setState] = useState<ResultsState | null>(null);
  const [splitCode, setSplitCode] = useState<string | null>(null);
  const [splitName, setSplitName] = useState<string>("");
  const [splitStatus, setSplitStatusState] = useState<"open" | "closed">("open");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Derive activeSplitCode: URL params first, then sessionStorage
  const activeSplitCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("splitCode");
    if (urlCode && urlCode !== 'null') return urlCode;
    const storedCode = sessionStorage.getItem("easysplit-split-code");
    if (storedCode && storedCode !== 'null') return storedCode;
    return null;
  }, []);

  // If there's an active split code but no state, fetch the split from API
  const shouldFetch = !!activeSplitCode && !state && !fetchError;
  const { data: savedSplit, isLoading: isLoadingSplit, isError: isSplitError } = useQuery<{
    code: string;
    name?: string | null;
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
    queryKey: [`/api/splits/${activeSplitCode}`],
    enabled: shouldFetch,
    retry: false,
  });

  // Handle fetch error - clear stale code from storage
  useEffect(() => {
    if (isSplitError && activeSplitCode) {
      setFetchError(true);
      sessionStorage.removeItem("easysplit-split-code");
    }
  }, [isSplitError, activeSplitCode]);

  // Handle initial setup
  useEffect(() => {
    // Sync splitCode state with activeSplitCode
    if (activeSplitCode) {
      setSplitCode(activeSplitCode);
      sessionStorage.setItem("easysplit-split-code", activeSplitCode);
    }

    // Load from session results if available
    const sessionData = sessionStorage.getItem("easysplit-results");
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        setState(data);
        if (data.splitName) {
          setSplitName(data.splitName);
        }
        sessionStorage.removeItem("easysplit-results");
      } catch (e) {
        console.error("Failed to parse session results", e);
      }
    }
  }, [activeSplitCode]);

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
      setSplitName(savedSplit.name || "");
    }
  }, [savedSplit, state]);

  // Load split status when code changes
  useEffect(() => {
    if (splitCode) {
      const status = getSplitStatus(splitCode);
      setSplitStatusState(status);
    }
  }, [splitCode]);

  const saveSplitMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
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
        // Prepend and cap at 50
        const newHistory = [data.code, ...savedSplits].slice(0, 50);
        localStorage.setItem("easysplit-my-splits", JSON.stringify(newHistory));

        // Invalidate My Splits query so it updates if the page is open
        queryClient.invalidateQueries({
          queryKey: ['/api/splits/batch']
        });
      }

      // Mark split as open
      setSplitStatus(data.code, "open");
      setSplitStatusState("open");

      logAnalyticsEvent(AnalyticsEvents.SPLIT_CREATED);

      toast({
        title: "Split saved!",
        description: "Your bill split has been saved and can be shared",
      });

      // Open share drawer automatically
      setIsShareOpen(true);
    },
    onError: (error: Error) => {
      console.error("[Save Split Error]", error.message);
      console.error("[Save Split Error Full]", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save split",
        variant: "destructive",
      });
    },
  });

  // Show loading state while fetching from API
  if (!state && isLoadingSplit && activeSplitCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading split...</p>
        </div>
      </div>
    );
  }

  // Show error state if fetch failed
  if (!state && fetchError && activeSplitCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Split not found or has expired</p>
          <div className="flex gap-2 justify-center">
            <Link href="/my-splits">
              <Button variant="outline">View History</Button>
            </Link>
            <Link href="/split-bill">
              <Button>Start New Split</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    const payload = {
      name: splitName.trim() || undefined,
      menuCode,
      people,
      items,
      quantities,
      currency,
      serviceCharge,
      tipPercent,
      totals,
    };
    console.log("[Save Split Payload]", JSON.stringify(payload, null, 2));
    saveSplitMutation.mutate(payload);
  };

  const toggleSplitStatus = () => {
    if (!splitCode) return;

    const newStatus = splitStatus === "open" ? "closed" : "open";
    setSplitStatus(splitCode, newStatus);
    setSplitStatusState(newStatus);

    toast({
      title: newStatus === "closed" ? "Split closed" : "Split reopened",
      description: newStatus === "closed"
        ? "This split is marked as finished"
        : "This split is now active again",
    });
  };

  const copyLink = async () => {
    if (!splitCode) return;

    const url = `${window.location.origin}/split/${splitCode}`;

    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      logAnalyticsEvent(AnalyticsEvents.LINK_COPIED);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (!splitCode) return;

    const url = `${window.location.origin}/split/${splitCode}`;
    logAnalyticsEvent(AnalyticsEvents.SHARE_OPENED);

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
        logAnalyticsEvent(AnalyticsEvents.LINK_COPIED);
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
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
        <Link href="/split-bill">
          <Button variant="ghost" size="icon" className="h-11 w-11" data-testid="button-back">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Results</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {splitName && (
          <div className="text-center">
            <h2 className="text-2xl font-bold" data-testid="text-split-name">{splitName}</h2>
            {splitCode && <p className="text-sm text-muted-foreground mt-1">Split #{splitCode}</p>}
          </div>
        )}

        {/* Extra Contribution Note - shown when someone has added extra money */}
        {(() => {
          const contributorsWithExtra = totals.filter((t) => (t.extraContribution ?? 0) > 0);
          if (contributorsWithExtra.length > 0) {
            const contributorNames = contributorsWithExtra.map((t) => t.person.name);
            const totalExtra = contributorsWithExtra.reduce((sum, t) => sum + (t.extraContribution ?? 0), 0);
            return (
              <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-extra-contribution-note">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {contributorNames.length === 1
                        ? `${contributorNames[0]} added ${currency}${totalExtra.toFixed(2)} extra to help cover the bill.`
                        : `${contributorNames.join(" & ")} added ${currency}${totalExtra.toFixed(2)} extra to help cover the bill.`}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Everyone else's share has been automatically reduced.
                    </p>
                  </div>
                </div>
              </Card>
            );
          }
          return null;
        })()}

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

            const extraContribution = personTotal.extraContribution ?? 0;
            const baseTotal = personTotal.baseTotal ?? personTotal.total;
            const hasExtraContributors = totals.some((t) => (t.extraContribution ?? 0) > 0);
            const reduction = hasExtraContributors && extraContribution === 0 ? baseTotal - personTotal.total : 0;

            return (
              <Card key={personTotal.person.id} className="p-6" data-testid={`card-person-${personTotal.person.id}`}>
                <h3 className="text-xl font-semibold mb-4">{personTotal.person.name}</h3>

                {personItems.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {personItems.map((pItem, idx) => {
                      const qtyLabel = formatQuantity(pItem.quantity);

                      return (
                        <div key={idx} className="flex justify-between gap-2 text-sm" data-testid={`item-${personTotal.person.id}-${idx}`}>
                          <span className="text-muted-foreground">
                            {qtyLabel && <span className="font-medium text-foreground mr-1">{qtyLabel}</span>}
                            {pItem.item.name}
                          </span>
                          <span className="font-mono">
                            {currency}{(pItem.item.price * pItem.quantity).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
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
                  {extraContribution > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Extra Contribution</span>
                      <span data-testid={`text-extra-${personTotal.person.id}`}>
                        +{currency}{extraContribution.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {reduction > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Reduction from others</span>
                      <span data-testid={`text-reduction-${personTotal.person.id}`}>
                        -{currency}{reduction.toFixed(2)}
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

        {!splitCode && (
          <div className="flex justify-center">
            <Link href="/split-bill">
              <Button
                variant="outline"
                size="lg"
                data-testid="button-adjust-before-save"
              >
                <Edit className="h-4 w-4 mr-2" />
                Make Changes
              </Button>
            </Link>
          </div>
        )}

        <div className="flex gap-2">
          {!splitCode ? (
            <Button
              onClick={handleSaveSplit}
              disabled={saveSplitMutation.isPending}
              className="flex-1 h-14 text-lg"
              data-testid="button-save-split"
            >
              <Share2 className="h-5 w-5 mr-2" />
              {saveSplitMutation.isPending ? "Saving..." : "Save & Share"}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => navigate(`/adjust-split/${splitCode}`)}
                variant="secondary"
                className="flex-1 h-12"
                data-testid="button-adjust-split"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit
              </Button>
              <Drawer.Root open={isShareOpen} onOpenChange={setIsShareOpen}>
                <Drawer.Trigger asChild>
                  <Button className="flex-[2] h-12" data-testid="button-open-share">
                    <Share2 className="h-5 w-5 mr-2" />
                    Share Split
                  </Button>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                  <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] z-50 rounded-t-[10px] outline-none">
                    <div className="bg-background rounded-t-[10px] p-4 max-w-md mx-auto shadow-2xl">
                      <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

                      <div className="px-4 pb-8 space-y-4">
                        <h2 className="text-xl font-semibold text-center mb-6">Share this Split</h2>

                        <Button variant="outline" className="w-full h-14 justify-start text-lg px-4" onClick={() => {
                          copyLink();
                          setIsShareOpen(false);
                        }}>
                          <LinkIcon className="h-6 w-6 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Copy Link</div>
                            <div className="text-xs text-muted-foreground font-normal">Send a direct link to your friends</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full h-14 justify-start text-lg px-4" onClick={() => {
                          copyBreakdown();
                          setIsShareOpen(false);
                        }}>
                          <FileText className="h-6 w-6 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Copy Text Breakdown</div>
                            <div className="text-xs text-muted-foreground font-normal">Paste a summary into WhatsApp/SMS</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full h-14 justify-start text-lg px-4" onClick={() => {
                          shareLink();
                          setIsShareOpen(false);
                        }}>
                          <Share2 className="h-6 w-6 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Share via...</div>
                            <div className="text-xs text-muted-foreground font-normal">Use system share sheet</div>
                          </div>
                        </Button>

                        <Separator className="my-2" />

                        <Button
                          onClick={() => {
                            toggleSplitStatus();
                            setIsShareOpen(false);
                          }}
                          variant={splitStatus === "open" ? "destructive" : "default"}
                          className="w-full h-12"
                        >
                          {splitStatus === "open" ? (
                            <>
                              <XCircle className="h-5 w-5 mr-2" />
                              Close Split
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-5 w-5 mr-2" />
                              Reopen Split
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer with Grand Total */}
      <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground border-t shadow-lg z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Grand Total</span>
            <span className="text-2xl font-bold font-mono" data-testid="text-grand-total">
              {currency}{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
