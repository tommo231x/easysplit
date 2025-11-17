import { Link } from "wouter";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MySplits() {
  const [splitToDelete, setSplitToDelete] = useState<string | null>(null);
  const [savedSplitCodes, setSavedSplitCodes] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadCodes = () => {
        const codes = JSON.parse(localStorage.getItem("easysplit-my-splits") || "[]");
        setSavedSplitCodes(codes);
      };
      
      loadCodes();
      
      // Listen for storage changes (cross-tab updates)
      window.addEventListener('storage', loadCodes);
      
      // Also refetch when window regains focus
      const handleFocus = () => {
        loadCodes();
        queryClient.invalidateQueries({
          queryKey: ['/api/splits/batch']
        });
      };
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('storage', loadCodes);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  const { data: splits } = useQuery<Array<{
    code: string;
    menuCode: string | null;
    people: Array<{ id: string; name: string }>;
    totals: Array<{
      person: { id: string; name: string };
      subtotal: number;
      service: number;
      tip: number;
      total: number;
    }>;
    currency: string;
    createdAt: string;
  }>>({
    queryKey: ['/api/splits/batch', savedSplitCodes],
    queryFn: async () => {
      if (savedSplitCodes.length === 0) return [];
      
      const results = await Promise.all(
        savedSplitCodes.map(async (code: string) => {
          try {
            const response = await fetch(`/api/splits/${code}`);
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

  const handleDelete = (code: string) => {
    const savedSplits = JSON.parse(localStorage.getItem("easysplit-my-splits") || "[]");
    const updated = savedSplits.filter((c: string) => c !== code);
    localStorage.setItem("easysplit-my-splits", JSON.stringify(updated));
    setSavedSplitCodes(updated);
    setSplitToDelete(null);
    
    // Invalidate the query to trigger refetch with new codes
    queryClient.invalidateQueries({
      queryKey: ['/api/splits/batch']
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b h-16 flex items-center px-4 gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">My Splits</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {savedSplitCodes.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No saved splits yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Split a bill and click "Save & Share" to keep track of it here
              </p>
              <Link href="/split-bill">
                <Button data-testid="button-go-split-bill">Split a Bill</Button>
              </Link>
            </div>
          </Card>
        ) : splits && splits.length > 0 ? (
          splits.map((split) => {
            const grandTotal = split.totals.reduce((sum, t) => sum + t.total, 0);
            const participantNames = split.people.map((p) => p.name).join(", ");
            const date = new Date(split.createdAt);

            return (
              <Card key={split.code} className="p-6" data-testid={`card-split-${split.code}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded font-semibold">
                        {split.code}
                      </code>
                      <span className="text-sm text-muted-foreground">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 truncate">
                      {participantNames}
                    </p>
                    <p className="font-semibold text-lg">
                      {split.currency}{grandTotal.toFixed(2)}
                    </p>
                    {split.menuCode && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From menu: {split.menuCode}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/split/${split.code}`}>
                      <Button variant="outline" size="icon" data-testid={`button-view-${split.code}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSplitToDelete(split.code)}
                      data-testid={`button-delete-${split.code}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading your splits...</p>
            </div>
          </Card>
        )}
      </main>

      <AlertDialog open={!!splitToDelete} onOpenChange={() => setSplitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from My Splits?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the split from your list. The split will still be accessible via its share link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => splitToDelete && handleDelete(splitToDelete)}
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
