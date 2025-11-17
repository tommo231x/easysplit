import { Link } from "wouter";
import { FileText, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
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
      </main>
    </div>
  );
}
