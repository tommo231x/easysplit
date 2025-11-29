import { useRoute, Link } from "wouter";
import { ArrowLeft, Copy, Check, Edit, Link as LinkIcon, Share2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { setSplitStatus, getSplitStatus } from "@/lib/split-status";

export default function ViewSplit() {
  const [, params] = useRoute("/split/:code");
  const code = params?.code?.toUpperCase() || "";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [splitStatus, setSplitStatusState] = useState<"open" | "closed">("open");
  
  // Load split status when code changes
  useEffect(() => {
    if (code) {
      const status = getSplitStatus(code);
      setSplitStatusState(status);
    }
  }, [code]);

  const { data, isLoading } = useQuery<{
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
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
    refetchIntervalInBackground: false, // Only refresh when tab is active
  });
  

  const copyBreakdown = async () => {
    if (!data) return;

    let text = "Bill Split Breakdown\n";
    text += "=".repeat(30) + "\n\n";

    data.totals.forEach((t) => {
      text += `${t.person.name}\n`;
      
      // Add itemized list
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
      
      text += `  Subtotal: ${data.currency}${t.subtotal.toFixed(2)}\n`;
      if (t.service > 0) {
        text += `  Service (${data.serviceCharge}%): ${data.currency}${t.service.toFixed(2)}\n`;
      }
      if (t.tip > 0) {
        text += `  Tip (${data.tipPercent}%): ${data.currency}${t.tip.toFixed(2)}\n`;
      }
      text += `  Total: ${data.currency}${t.total.toFixed(2)}\n\n`;
    });

    const grandTotal = data.totals.reduce((sum, t) => sum + t.total, 0);
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

  const grandTotal = data.totals.reduce((sum, t) => sum + t.total, 0);

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
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {data.name && (
          <div className="text-center">
            <h2 className="text-2xl font-bold" data-testid="text-split-name">{data.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Split #{data.code}</p>
          </div>
        )}
        
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

        {data.totals.map((personTotal) => {
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
                    {data.currency}{personTotal.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service ({data.serviceCharge}%)</span>
                  <span data-testid={`text-service-${personTotal.person.id}`}>
                    {data.currency}{personTotal.service.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip ({data.tipPercent}%)</span>
                  <span data-testid={`text-tip-${personTotal.person.id}`}>
                    {data.currency}{personTotal.tip.toFixed(2)}
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
          <Link href={`/adjust-split/${code}`} className="flex-1">
            <Button variant="default" className="w-full" data-testid="button-adjust-split">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
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
