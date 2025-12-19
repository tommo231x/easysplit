import { Link } from "wouter";
import { FileText, Calculator, History, Circle, ChevronRight, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getAllSplitStatuses, type SplitStatus } from "@/lib/split-status";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";

export default function Home() {
  const [activeSplits, setActiveSplits] = useState<SplitStatus[]>([]);
  const [closedSplits, setClosedSplits] = useState<SplitStatus[]>([]);
  const [savedSplitCodes, setSavedSplitCodes] = useState<string[]>([]);

  useEffect(() => {
    const loadStatuses = () => {
      const allStatuses = getAllSplitStatuses();
      const openSplits = allStatuses
        .filter(s => s.status === "open")
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      const closed = allStatuses
        .filter(s => s.status === "closed")
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setActiveSplits(openSplits);
      setClosedSplits(closed);

      const codes = JSON.parse(localStorage.getItem("easysplit-my-splits") || "[]");
      setSavedSplitCodes(codes);
    };

    loadStatuses();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "easysplit-split-statuses" || e.key === "easysplit-my-splits" || e.key === null) {
        loadStatuses();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const { data: splitDetails } = useQuery<Array<{
    code: string;
    name?: string | null;
    people: Array<{ id: string; name: string }>;
    totals: Array<{ total: number }>;
    currency: string;
    createdAt: string;
  }>>({
    queryKey: ['/api/splits/batch', savedSplitCodes],
    queryFn: async () => {
      if (savedSplitCodes.length === 0) return [];

      const results = await Promise.all(
        savedSplitCodes.map(async (code: string) => {
          try {
            const response = await fetch(getApiUrl(`/api/splits/${code}`));
            if (!response.ok) return null;
            return await response.json();
          } catch {
            return null;
          }
        })
      );

      return results.filter((split) => split !== null);
    },
    enabled: savedSplitCodes.length > 0,
  });

  const recentActive = activeSplits.slice(0, 3);
  const hasMoreActive = activeSplits.length > 3;

  const getSplitDetail = (code: string) => {
    return splitDetails?.find(s => s.code === code);
  };

  const getStatus = (code: string) => {
    const active = activeSplits.find(s => s.code === code);
    if (active) return "open";
    const closed = closedSplits.find(s => s.code === code);
    if (closed) return "closed";
    return "open";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4">
        <BrandLogo size="lg" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold mb-2">Split bills with ease</h2>
          <p className="text-muted-foreground">
            Upload a menu or split a bill quickly and fairly
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/split-bill" className="col-span-2">
            <div className="group relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer min-h-[180px] flex flex-col justify-between" data-testid="button-split-bill">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Calculator className="h-32 w-32 rotate-12" />
              </div>
              <div className="relative z-10">
                <Calculator className="h-8 w-8 mb-4 opacity-90" />
                <h2 className="text-2xl font-bold mb-1">Split a Bill</h2>
                <p className="opacity-90 font-medium">Start a new split instantly</p>
              </div>
              <div className="relative z-10 flex justify-end">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/create-menu">
            <Card className="h-full border-dashed border-2 bg-card/50 hover:bg-card/80 flex flex-col justify-between" data-testid="button-create-menu">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <FileText className="h-6 w-6 text-muted-foreground mb-3" />
                <div>
                  <h3 className="font-semibold text-foreground">Load Menu</h3>
                  <p className="text-sm text-muted-foreground">From Code</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-splits">
            <Card className="h-full bg-secondary/10 hover:bg-secondary/20 border-secondary/20 flex flex-col justify-between" data-testid="button-my-splits">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <History className="h-6 w-6 text-foreground mb-3" />
                <div>
                  <h3 className="font-semibold text-foreground">History</h3>
                  <p className="text-sm text-muted-foreground">Past Splits</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {recentActive.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-semibold">Recent Splits</h3>
              {hasMoreActive && (
                <Link href="/my-splits">
                  <Button variant="ghost" size="sm" data-testid="button-view-all">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {recentActive.map((split) => {
                const detail = getSplitDetail(split.code);
                const grandTotal = detail?.totals?.reduce((sum, t) => sum + t.total, 0) || 0;

                return (
                  <Link key={split.code} href={`/split/${split.code}`}>
                    <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-active-split-${split.code}`}>
                      <div className="flex items-center gap-3">
                        <Circle className="h-3 w-3 fill-green-500 text-green-500 flex-shrink-0" data-testid="icon-active-indicator" />
                        <div className="flex-1 min-w-0">
                          {detail?.name ? (
                            <div className="font-medium truncate" data-testid={`text-split-name-${split.code}`}>
                              {detail.name}
                            </div>
                          ) : (
                            <div className="font-medium font-mono" data-testid={`text-split-code-${split.code}`}>
                              {split.code}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {detail?.people && (
                              <span>{detail.people.length} people</span>
                            )}
                            {grandTotal > 0 && (
                              <span className="font-medium">{detail?.currency}{grandTotal.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* About EasySplit Section */}
        <div className="mt-16 mb-12 border-t pt-8">
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">About EasySplit</h3>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                EasySplit makes it easier to split the bill when you go out to eat or drink.
              </p>
              <p>
                It helps you keep track as you go, so there's no awkward maths or arguments at the end.
              </p>
              <p>
                You can share a live link so others join in, or just use it yourself and add names manually — everyone doesn't have to be involved.
              </p>
              <p>
                There's no app to download and no account to create, so it's quick to start and easy to use.
              </p>
              <p>
                EasySplit runs entirely in the browser on any modern phone or computer.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t py-8 text-center text-xs text-muted-foreground">
          <p className="mb-2">Built by FinaFeels &amp; Thomas O'Connor</p>
          <a 
            href="https://www.instagram.com/finafeels/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" />
            @finafeels
          </a>
        </footer>
      </main>
    </div>
  );
}
