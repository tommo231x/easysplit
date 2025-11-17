import { Link } from "wouter";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { MenuItem, Person, ItemQuantity, PersonTotal } from "@shared/schema";

interface ResultsState {
  items: MenuItem[];
  people: Person[];
  quantities: ItemQuantity[];
  currency: string;
  serviceCharge: number;
  tipPercent: number;
}

export default function Results() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<ResultsState | null>(null);

  useEffect(() => {
    const sessionData = sessionStorage.getItem("easysplit-results");
    if (sessionData) {
      setState(JSON.parse(sessionData));
      sessionStorage.removeItem("easysplit-results");
    }
  }, []);

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

  const { items, people, quantities, currency, serviceCharge, tipPercent } = state;

  const calculateTotals = (): PersonTotal[] => {
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

  const copyBreakdown = async () => {
    let text = "Bill Split Breakdown\n";
    text += "=".repeat(30) + "\n\n";

    totals.forEach((t) => {
      text += `${t.person.name}\n`;
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
          {totals.map((personTotal) => (
            <Card key={personTotal.person.id} className="p-6" data-testid={`card-person-${personTotal.person.id}`}>
              <h3 className="text-xl font-semibold mb-4">{personTotal.person.name}</h3>
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
          ))}
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

        <Button
          onClick={copyBreakdown}
          variant="outline"
          className="w-full h-12"
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
      </main>
    </div>
  );
}
