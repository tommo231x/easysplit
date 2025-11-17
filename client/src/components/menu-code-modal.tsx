import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MenuCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  menuName?: string;
}

export default function MenuCodeModal({
  open,
  onOpenChange,
  code,
  menuName,
}: MenuCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

const shareUrl = `${window.location.origin}/split-bill?code=${code}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Menu code copied to clipboard",
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
    try {
      if (navigator.share) {
        await navigator.share({
          title: menuName ? `Menu: ${menuName}` : "Menu",
          text: `Use code ${code} to split the bill`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
      }
    } catch (err) {
      // User cancelled share or copy failed
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-menu-code">
        <DialogHeader>
          <DialogTitle className="text-2xl">Menu Saved!</DialogTitle>
          <DialogDescription>
            {menuName
              ? `Your menu "${menuName}" has been saved`
              : "Your menu has been saved"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your menu code:</p>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 bg-muted rounded-lg p-4 text-center font-mono text-3xl font-semibold tracking-widest"
                data-testid="text-menu-code"
              >
                {code}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCode}
                className="h-14 w-14 flex-shrink-0"
                data-testid="button-copy-code"
              >
                {copied ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Share link:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg p-3 text-sm font-mono truncate">
                {shareUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={shareLink}
                className="flex-shrink-0"
                data-testid="button-share-link"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Others can use this code to load your menu when splitting a bill
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
