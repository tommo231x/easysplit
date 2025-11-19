import { Link } from "wouter";
import { FileText, Calculator, History, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getAllSplitStatuses, type SplitStatus } from "@/lib/split-status";

export default function Home() {
  const [activeSplits, setActiveSplits] = useState<SplitStatus[]>([]);

  useEffect(() => {
    // Load all splits with open status
    const allStatuses = getAllSplitStatuses();
    const openSplits = allStatuses.filter(s => s.status === "open");
    setActiveSplits(openSplits);

    // Listen for storage changes to update when splits change in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "easysplit-split-statuses" || e.key === null) {
        const updatedStatuses = getAllSplitStatuses();
        const updatedOpenSplits = updatedStatuses.filter(s => s.status === "open");
        setActiveSplits(updatedOpenSplits);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4">
        <h1 className="text-2xl font-semibold">EasySplit</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold mb-2">Split bills with ease</h2>
          <p className="text-muted-foreground">
            Upload a menu or split a bill quickly and fairly
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/create-menu">
            <Button
              variant="default"
              className="w-full min-h-20 rounded-xl p-6 flex items-center justify-start gap-4 text-base"
              data-testid="button-create-menu"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Create / Upload Menu</div>
                <div className="text-sm opacity-90">
                  Save a menu and get a shareable code
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/split-bill">
            <Button
              variant="secondary"
              className="w-full min-h-20 rounded-xl p-6 flex items-center justify-start gap-4 text-base"
              data-testid="button-split-bill"
            >
              <Calculator className="h-6 w-6 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Split a Bill</div>
                <div className="text-sm opacity-90">
                  Calculate who owes what
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/my-splits">
            <Button
              variant="outline"
              className="w-full min-h-20 rounded-xl p-6 flex items-center justify-start gap-4 text-base"
              data-testid="button-my-splits"
            >
              <History className="h-6 w-6 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">My Splits</div>
                <div className="text-sm opacity-90">
                  View your saved bill splits
                </div>
              </div>
            </Button>
          </Link>
        </div>

        {activeSplits.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 px-2">Active Splits</h3>
            <div className="space-y-2">
              {activeSplits.map((split) => (
                <Link key={split.code} href={`/split/${split.code}`}>
                  <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-active-split-${split.code}`}>
                    <div className="flex items-center gap-3">
                      <Circle className="h-3 w-3 fill-green-500 text-green-500 flex-shrink-0" data-testid="icon-active-indicator" />
                      <div className="flex-1">
                        <div className="font-medium font-mono text-lg" data-testid={`text-split-code-${split.code}`}>
                          {split.code}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tap to view split details
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
