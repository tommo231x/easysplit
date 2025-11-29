import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Copy, Check, UserPlus, Link as LinkIcon, Share2, CheckCircle2, XCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
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
          <h2 className="text-lg font-semibold mb-4">Split Details</h2>
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
        </Card>

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
          const fullTotal = displayTotals.find(t => t.person.id === personTotal.person.id);
          const subtotal = (fullTotal as any)?.subtotal ?? personTotal.total;
          const service = (fullTotal as any)?.service ?? 0;
          const tip = (fullTotal as any)?.tip ?? 0;

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
