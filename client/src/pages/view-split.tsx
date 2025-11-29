import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Copy, Check, UserPlus, Link as LinkIcon, Share2, CheckCircle2, XCircle, Edit, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { setSplitStatus, getSplitStatus } from "@/lib/split-status";

export default function ViewSplit() {
  const [, params] = useRoute("/split/:code");
  const code = params?.code?.toUpperCase() || "";
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [splitStatus, setSplitStatusState] = useState<"open" | "closed">("open");
  const [userName, setUserName] = useState("");
  const [isEditingCharges, setIsEditingCharges] = useState(false);
  const [editServiceCharge, setEditServiceCharge] = useState(0);
  const [editTipPercent, setEditTipPercent] = useState(0);
  const previousTotalsRef = useRef<Array<{ person: { id: string; name: string }; total: number }> | null>(null);
  
  // Load saved user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("easysplit-user-name") || "";
    setUserName(savedName);
  }, []);
  
  // Load split status when code changes
  useEffect(() => {
    if (code) {
      const status = getSplitStatus(code);
      setSplitStatusState(status);
    }
  }, [code]);

  const { data, isLoading, isFetching } = useQuery<{
    code: string;
    name?: string | null;
    menuCode: string | null;
    people: Array<{ id: string; name: string }>;
    items: Array<{ id: number; name: string; price: number }>;
    quantities: Array<{ itemId: number; personId: string; quantity: number }>;
    currency: string;
    serviceCharge: number;
    tipPercent: number;
    totals: Array<{
      person: { id: string; name: string };
      subtotal: number;
      service: number;
      tip: number;
      total: number;
      extraContribution?: number;
      baseTotal?: number;
    }>;
    createdAt: string;
  }>({
    queryKey: [`/api/splits/${code}`],
    enabled: code.length >= 6 && code.length <= 8,
    retry: false,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
  
  // Store previous totals to avoid showing zeros during refresh
  useEffect(() => {
    if (data?.totals && data.totals.length > 0) {
      const hasAnyNonZeroSubtotal = data.totals.some((t: any) => t.subtotal > 0);
      const cacheIsEmpty = !previousTotalsRef.current || previousTotalsRef.current.length === 0;
      
      // Check if there are any assigned items (quantities with count > 0)
      const hasAssignedItems = data.quantities?.some((q) => q.quantity > 0) ?? false;
      
      // All subtotals being zero is legitimate when:
      // - No items are assigned to anyone (hasAssignedItems is false)
      // In this case, zeros are the real state, not a recalculation artifact
      const isLegitimateZeroState = !hasAnyNonZeroSubtotal && !hasAssignedItems;
      
      // Accept the update if:
      // 1. Cache is empty (first load)
      // 2. Payload has any non-zero subtotals (real data with values)
      // 3. Legitimate zero state (no items assigned, zeros are real)
      if (cacheIsEmpty || hasAnyNonZeroSubtotal || isLegitimateZeroState) {
        previousTotalsRef.current = data.totals;
      }
    }
  }, [data?.totals, data?.quantities]);
  
  // Always use cached totals to avoid showing zeros during recalculation
  // Only fall back to current data when cache is empty
  const displayTotals = previousTotalsRef.current && previousTotalsRef.current.length > 0
    ? previousTotalsRef.current
    : (data?.totals || []);

  // Check if user's name already exists in the split
  const userNameLower = userName.toLowerCase().trim();
  const existingPerson = data?.people.find(
    p => p.name.toLowerCase().trim() === userNameLower
  );
  const isUserInSplit = !!existingPerson && userName.trim().length > 0;
  
  // Navigate to adjust page - passes name via sessionStorage for new users
  const handleAddYoursClick = () => {
    if (!userName.trim()) {
      toast({
        title: "Enter your name",
        description: "Please enter your name first",
        variant: "destructive",
      });
      return;
    }
    
    // Save user name to localStorage for future use
    localStorage.setItem("easysplit-user-name", userName.trim());
    
    if (isUserInSplit && existingPerson) {
      // Pass existing person's ID so adjust page can scroll to their section
      sessionStorage.setItem("easysplit-focus-person-id", existingPerson.id);
    } else {
      // Pass new person's name so adjust page can create them
      sessionStorage.setItem("easysplit-add-person-name", userName.trim());
    }
    
    navigate(`/adjust-split/${code}`);
  };
  
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddYoursClick();
  };

  const copyBreakdown = async () => {
    if (!data || displayTotals.length === 0) return;

    let text = "Bill Split Breakdown\n";
    text += "=".repeat(30) + "\n\n";

    // Use displayTotals (cached) to avoid copying zeros during recalculation
    displayTotals.forEach((t: any) => {
      text += `${t.person.name}\n`;
      
      const personItems = data.quantities
        .filter((q) => q.personId === t.person.id)
        .map((q) => {
          const item = data.items.find((i) => i.id === q.itemId);
          return { ...q, item: item! };
        })
        .filter((q) => q.item);
      
      personItems.forEach((pItem) => {
        text += `  ${pItem.quantity}x ${pItem.item.name} - ${data.currency}${(pItem.item.price * pItem.quantity).toFixed(2)}\n`;
      });
      
      if (personItems.length > 0) {
        text += `  ---\n`;
      }
      
      const subtotal = t.subtotal ?? 0;
      const service = t.service ?? 0;
      const tip = t.tip ?? 0;
      
      text += `  Subtotal: ${data.currency}${subtotal.toFixed(2)}\n`;
      if (service > 0) {
        text += `  Service (${data.serviceCharge}%): ${data.currency}${service.toFixed(2)}\n`;
      }
      if (tip > 0) {
        text += `  Tip (${data.tipPercent}%): ${data.currency}${tip.toFixed(2)}\n`;
      }
      text += `  Total: ${data.currency}${t.total.toFixed(2)}\n\n`;
    });

    const grandTotal = displayTotals.reduce((sum: number, t: any) => sum + t.total, 0);
    text += "=".repeat(30) + "\n";
    text += `Grand Total: ${data.currency}${grandTotal.toFixed(2)}\n`;
    
    const fullText = text;

    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Copied!",
        description: "Bill breakdown copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
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
    const url = window.location.href;
    const title = data?.name || "Bill Split";
    
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out "${title}"`,
          url,
        });
      } else {
        await copyLink();
      }
    } catch (err) {
      // User cancelled share
    }
  };

  const toggleSplitStatus = () => {
    if (!code) return;
    
    const newStatus = splitStatus === "open" ? "closed" : "open";
    setSplitStatus(code, newStatus);
    setSplitStatusState(newStatus);
    
    toast({
      title: newStatus === "closed" ? "Split closed" : "Split reopened",
      description: newStatus === "closed" 
        ? "This split is marked as finished" 
        : "This split is now active again",
    });
  };

  // Start editing service charge and tip
  const startEditingCharges = () => {
    if (data) {
      setEditServiceCharge(data.serviceCharge);
      setEditTipPercent(data.tipPercent);
      setIsEditingCharges(true);
    }
  };

  // Mutation to update service charge and tip
  const updateChargesMutation = useMutation({
    mutationFn: async ({ serviceCharge, tipPercent }: { serviceCharge: number; tipPercent: number }) => {
      if (!data) throw new Error("No data");
      
      // Get extra contributions from existing totals
      const extraContributions = new Map<string, number>();
      data.totals.forEach((t) => {
        if ((t.extraContribution ?? 0) > 0) {
          extraContributions.set(t.person.id, t.extraContribution ?? 0);
        }
      });
      
      // Calculate base totals first
      const baseTotals = data.people.map((person) => {
        const personQuantities = data.quantities.filter((q) => q.personId === person.id);
        const subtotal = personQuantities.reduce((sum, q) => {
          const item = data.items.find((i) => i.id === q.itemId);
          return sum + (item ? item.price * q.quantity : 0);
        }, 0);
        const service = (subtotal * serviceCharge) / 100;
        const tip = (subtotal * tipPercent) / 100;
        const baseTotal = subtotal + service + tip;
        const extraContribution = extraContributions.get(person.id) || 0;
        
        return {
          person,
          subtotal: Math.round(subtotal * 100) / 100,
          service: Math.round(service * 100) / 100,
          tip: Math.round(tip * 100) / 100,
          baseTotal: Math.round(baseTotal * 100) / 100,
          extraContribution,
        };
      });
      
      // Apply redistribution algorithm for extra contributions
      const totalExtraContributions = baseTotals.reduce((sum, t) => sum + t.extraContribution, 0);
      const reductions = new Map<string, number>();
      baseTotals.forEach((t) => reductions.set(t.person.id, 0));
      
      let remaining = totalExtraContributions;
      let activeRecipients = baseTotals.filter((t) => t.extraContribution === 0);
      
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
      
      // Calculate final totals
      const newTotals = baseTotals.map((t) => {
        let adjustedTotal = t.baseTotal;
        
        if (t.extraContribution > 0) {
          adjustedTotal += t.extraContribution;
        } else {
          const reduction = reductions.get(t.person.id) || 0;
          adjustedTotal -= reduction;
        }
        
        return {
          person: t.person,
          subtotal: t.subtotal,
          service: t.service,
          tip: t.tip,
          total: Math.max(0, Math.round(adjustedTotal * 100) / 100),
          extraContribution: t.extraContribution,
          baseTotal: t.baseTotal,
        };
      });

      const response = await apiRequest("PATCH", `/api/splits/${code}`, {
        name: data.name,
        menuCode: data.menuCode,
        people: data.people,
        items: data.items,
        quantities: data.quantities,
        currency: data.currency,
        serviceCharge,
        tipPercent,
        totals: newTotals,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/splits/${code}`] });
      setIsEditingCharges(false);
      toast({
        title: "Charges updated!",
        description: "Service charge and tip have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update charges. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveCharges = () => {
    updateChargesMutation.mutate({
      serviceCharge: editServiceCharge,
      tipPercent: editTipPercent,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Loading...</h1>
        </header>
      </div>
    );
  }

  if (!data) {
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

  const grandTotal = displayTotals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold flex-1">Bill Split</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="indicator-live">
          <span className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
          <span>{isFetching ? 'Updating...' : 'Live'}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {data.name && (
          <div className="text-center">
            <h2 className="text-2xl font-bold" data-testid="text-split-name">{data.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Split #{data.code}</p>
          </div>
        )}
        
        {/* Quick Add Section */}
        <Card className="p-4 bg-primary/5">
          <form onSubmit={handleNameSubmit} className="space-y-3">
            <div>
              <label htmlFor="user-name" className="text-sm font-medium">
                Your name
              </label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
                data-testid="input-user-name"
              />
            </div>
            
            {userName.trim() && (
              <p className="text-sm text-muted-foreground" data-testid="text-user-status">
                {isUserInSplit 
                  ? `You're already in this split as "${existingPerson?.name}"`
                  : "You're not in this split yet"}
              </p>
            )}
            
            <Button
              type="button"
              onClick={handleAddYoursClick}
              disabled={!userName.trim()}
              className="w-full min-h-12"
              data-testid="button-add-yours"
            >
              {isUserInSplit ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Contributions
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Yours
                </>
              )}
            </Button>
          </form>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Split Details</h2>
            {!isEditingCharges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditingCharges}
                data-testid="button-edit-charges"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {isEditingCharges ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Split Code:</span>
                <span className="font-mono font-semibold text-sm">{data.code}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Service Charge (%)</label>
                <Input
                  type="number"
                  value={editServiceCharge}
                  onChange={(e) => setEditServiceCharge(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0"
                  className="h-10"
                  data-testid="input-edit-service-charge"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Tip (%)</label>
                <Input
                  type="number"
                  value={editTipPercent}
                  onChange={(e) => setEditTipPercent(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0"
                  className="h-10"
                  data-testid="input-edit-tip-percent"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingCharges(false)}
                  className="flex-1"
                  data-testid="button-cancel-edit-charges"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCharges}
                  disabled={updateChargesMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-charges"
                >
                  {updateChargesMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Split Code:</span>
                <span className="font-mono font-semibold">{data.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge:</span>
                <span>{data.serviceCharge}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tip:</span>
                <span>{data.tipPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Extra Contribution Note - shown when someone has added extra money */}
        {(() => {
          const contributorsWithExtra = displayTotals.filter((t: any) => (t.extraContribution ?? 0) > 0);
          if (contributorsWithExtra.length > 0) {
            const contributorNames = contributorsWithExtra.map((t: any) => t.person.name);
            const totalExtra = contributorsWithExtra.reduce((sum: number, t: any) => sum + (t.extraContribution ?? 0), 0);
            return (
              <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-extra-contribution-note">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {contributorNames.length === 1 
                        ? `${contributorNames[0]} added ${data.currency}${totalExtra.toFixed(2)} extra to help cover the bill.`
                        : `${contributorNames.join(" & ")} added ${data.currency}${totalExtra.toFixed(2)} extra to help cover the bill.`}
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

        {displayTotals.map((personTotal) => {
          const personItems = data.quantities
            .filter((q) => q.personId === personTotal.person.id)
            .map((q) => {
              const item = data.items.find((i) => i.id === q.itemId);
              return {
                ...q,
                item: item!,
              };
            })
            .filter((q) => q.item);
          
          // Use displayTotals for all monetary values (cached to avoid showing zeros)
          const fullTotal = displayTotals.find(t => t.person.id === personTotal.person.id) as any;
          const subtotal = fullTotal?.subtotal ?? personTotal.total;
          const service = fullTotal?.service ?? 0;
          const tip = fullTotal?.tip ?? 0;
          const extraContribution = fullTotal?.extraContribution ?? 0;
          const baseTotal = fullTotal?.baseTotal ?? personTotal.total;
          const hasExtraContributors = displayTotals.some((t: any) => (t.extraContribution ?? 0) > 0);
          const reduction = hasExtraContributors && extraContribution === 0 ? baseTotal - personTotal.total : 0;

          return (
            <Card key={personTotal.person.id} className="p-6" data-testid={`card-person-${personTotal.person.id}`}>
              <h3 className="text-lg font-semibold mb-4">{personTotal.person.name}</h3>
              
              {personItems.length > 0 && (
                <div className="mb-4 space-y-1">
                  {personItems.map((pItem, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-sm" data-testid={`item-${personTotal.person.id}-${idx}`}>
                      <span className="text-muted-foreground">
                        {pItem.quantity}x {pItem.item.name}
                      </span>
                      <span className="font-mono">
                        {data.currency}{(pItem.item.price * pItem.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <Separator className="my-3" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid={`text-subtotal-${personTotal.person.id}`}>
                    {data.currency}{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service ({data.serviceCharge}%)</span>
                  <span data-testid={`text-service-${personTotal.person.id}`}>
                    {data.currency}{service.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip ({data.tipPercent}%)</span>
                  <span data-testid={`text-tip-${personTotal.person.id}`}>
                    {data.currency}{tip.toFixed(2)}
                  </span>
                </div>
                {extraContribution > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Extra Contribution</span>
                    <span data-testid={`text-extra-${personTotal.person.id}`}>
                      +{data.currency}{extraContribution.toFixed(2)}
                    </span>
                  </div>
                )}
                {reduction > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Reduction from others</span>
                    <span data-testid={`text-reduction-${personTotal.person.id}`}>
                      -{data.currency}{reduction.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg" data-testid={`text-total-${personTotal.person.id}`}>
                      {data.currency}{personTotal.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        <Card className="p-6 bg-primary/5">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Grand Total</span>
            <span className="text-2xl font-bold" data-testid="text-grand-total">
              {data.currency}{grandTotal.toFixed(2)}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Shareable link:</span>
            <code className="flex-1 font-mono text-xs bg-background px-2 py-1 rounded border">
              {window.location.origin}/split/{code}
            </code>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copyLink}
              variant="outline"
              size="sm"
              className="flex-1"
              data-testid="button-copy-link"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              onClick={shareLink}
              variant="outline"
              size="sm"
              className="flex-1"
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button onClick={copyBreakdown} variant="outline" className="flex-1" data-testid="button-copy-breakdown">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            onClick={toggleSplitStatus}
            variant={splitStatus === "open" ? "destructive" : "default"}
            className="flex-1"
            data-testid="button-toggle-status"
          >
            {splitStatus === "open" ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Reopen
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
