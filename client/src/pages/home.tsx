import { Link } from "wouter";
import { FileText, Calculator, History, Circle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { getAllSplitStatuses, type SplitStatus } from "@/lib/split-status";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

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
  const olderActive = activeSplits.slice(3);

  const getSplitDetail = (code: string) => {
    return splitDetails?.find(s => s.code === code);
  };

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
        </div>

        {(recentActive.length > 0 || closedSplits.length > 0) && (
          <div className="mt-8">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active" data-testid="tab-active">
                  Active {recentActive.length > 0 && `(${activeSplits.length})`}
                </TabsTrigger>
                <TabsTrigger value="saved" data-testid="tab-saved">
                  Saved {closedSplits.length > 0 && `(${closedSplits.length})`}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4 space-y-2">
                {recentActive.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No active splits</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Split a bill to get started
                    </p>
                  </Card>
                ) : (
                  <>
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
                    
                    {hasMoreActive && (
                      <Link href="/my-splits">
                        <Button variant="ghost" className="w-full" data-testid="button-view-all-active">
                          <History className="h-4 w-4 mr-2" />
                          View All {activeSplits.length} Active Splits
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="saved" className="mt-4 space-y-2">
                {closedSplits.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No saved splits</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Close a split to move it here
                    </p>
                  </Card>
                ) : (
                  closedSplits.slice(0, 5).map((split) => {
                    const detail = getSplitDetail(split.code);
                    const grandTotal = detail?.totals?.reduce((sum, t) => sum + t.total, 0) || 0;
                    
                    return (
                      <Link key={split.code} href={`/split/${split.code}`}>
                        <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-saved-split-${split.code}`}>
                          <div className="flex items-center gap-3">
                            <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              {detail?.name ? (
                                <div className="font-medium truncate">
                                  {detail.name}
                                </div>
                              ) : (
                                <div className="font-medium font-mono">
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
                  })
                )}
                
                {closedSplits.length > 5 && (
                  <Link href="/my-splits">
                    <Button variant="ghost" className="w-full" data-testid="button-view-all-saved">
                      <History className="h-4 w-4 mr-2" />
                      View All Saved Splits
                    </Button>
                  </Link>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
