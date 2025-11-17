import { useRoute, Link } from "wouter";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ViewSplit() {
  const [, params] = useRoute("/split/:code");
  const code = params?.code?.toUpperCase() || "";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{
    code: string;
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
    enabled: code.length === 6,
    retry: false,
  });

  const copyBreakdown = async () => {
    if (!data) return;

    const breakdown = data.totals
      .map(
        (t) =>
          `${t.person.name}: ${data.currency}${t.total.toFixed(2)} (Subtotal: ${data.currency}${t.subtotal.toFixed(2)} + Service: ${data.currency}${t.service.toFixed(2)} + Tip: ${data.currency}${t.tip.toFixed(2)})`
      )
      .join("\n");

    const grandTotal = data.totals.reduce((sum, t) => sum + t.total, 0);
    const fullText = `Bill Split\n\n${breakdown}\n\nGrand Total: ${data.currency}${grandTotal.toFixed(2)}`;

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

  const shareLink = async () => {
    const url = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Bill Split",
          text: "Check out our bill split",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
      }
    } catch (err) {
      // User cancelled share
    }
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
        <h1 className="text-xl font-semibold">Bill Split</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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

        {data.totals.map((personTotal) => (
          <Card key={personTotal.person.id} className="p-6" data-testid={`card-person-${personTotal.person.id}`}>
            <h3 className="text-lg font-semibold mb-4">{personTotal.person.name}</h3>
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
        ))}

        <Card className="p-6 bg-primary/5">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Grand Total</span>
            <span className="text-2xl font-bold" data-testid="text-grand-total">
              {data.currency}{grandTotal.toFixed(2)}
            </span>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button onClick={copyBreakdown} variant="outline" className="flex-1" data-testid="button-copy-breakdown">
            <Copy className="h-4 w-4 mr-2" />
            Copy Breakdown
          </Button>
          <Button onClick={shareLink} className="flex-1" data-testid="button-share-link">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Share Link
          </Button>
        </div>
      </main>
    </div>
  );
}
