import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertMenuItem } from "@shared/schema";
import MenuCodeModal from "@/components/menu-code-modal";
import CurrencySelector from "@/components/currency-selector";

export default function CreateMenu() {
  const [menuName, setMenuName] = useState("");
  const [currency, setCurrency] = useState("£");
  const [pasteText, setPasteText] = useState("");
  const [items, setItems] = useState<InsertMenuItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [menuCode, setMenuCode] = useState("");
  const { toast } = useToast();

const createMenuMutation = useMutation({
    mutationFn: async (data: { name?: string; currency?: string; items: InsertMenuItem[] }) => {
      const response = await apiRequest("POST", "/api/menus", data);
      return response.json();
    },
    onSuccess: (data: { code: string }) => {
      // Store menu code in localStorage for tracking
      const ownedMenus = JSON.parse(localStorage.getItem("easysplit-menus") || "[]");
      if (!ownedMenus.includes(data.code)) {
        ownedMenus.push(data.code);
        localStorage.setItem("easysplit-menus", JSON.stringify(ownedMenus));
      }
      
      setMenuCode(data.code);
      setShowModal(true);
      toast({
        title: "Menu saved!",
        description: `Your menu code is ${data.code}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save menu. Please try again.",
        variant: "destructive",
      });
    },
  });

  const parseMenu = () => {
    const lines = pasteText.split("\n").filter((line) => line.trim());
    const parsed: InsertMenuItem[] = [];

    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const priceStr = parts[parts.length - 1].trim();
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));

        if (name && !isNaN(price) && price > 0) {
          parsed.push({ name, price });
        }
      }
    }

    if (parsed.length > 0) {
      setItems(parsed);
      setPasteText("");
      toast({
        title: "Menu parsed!",
        description: `Added ${parsed.length} items`,
      });
    } else {
      toast({
        title: "No items found",
        description: "Make sure each line has format: Item name, price",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setItems([...items, { name: "", price: 0 }]);
  };

  const updateItem = (index: number, field: "name" | "price", value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (items.length === 0) {
      toast({
        title: "No items",
        description: "Please add at least one menu item",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter((item) => item.name && item.price > 0);
    if (validItems.length === 0) {
      toast({
        title: "Invalid items",
        description: "All items must have a name and price",
        variant: "destructive",
      });
      return;
    }

    createMenuMutation.mutate({
      name: menuName || undefined,
      currency,
      items: validItems,
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
        <h1 className="text-xl font-semibold">Create Menu</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <Label htmlFor="menu-name" className="text-sm mb-2 block">
            Menu / Restaurant Name (Optional)
          </Label>
          <Input
            id="menu-name"
            placeholder="e.g., Pizza Palace"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            className="h-12"
            data-testid="input-menu-name"
          />
        </div>

        <CurrencySelector value={currency} onChange={setCurrency} />

        {items.length === 0 && (
          <Card className="p-6">
            <Label htmlFor="paste-menu" className="text-sm mb-2 block">
              Paste Menu (one item per line)
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Format: Item name, price (e.g., "Margherita Pizza, 12.50")
            </p>
            <Textarea
              id="paste-menu"
              placeholder="Margherita Pizza, 12.50&#10;Caesar Salad, 8.00&#10;Garlic Bread, 4.50"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="font-mono min-h-40 mb-4"
              data-testid="textarea-paste-menu"
            />
            <div className="flex gap-2">
              <Button
                onClick={parseMenu}
                disabled={!pasteText.trim()}
                className="flex-1"
                data-testid="button-parse-menu"
              >
                Parse Menu
              </Button>
              <Button
                onClick={addItem}
                variant="outline"
                className="flex-1"
                data-testid="button-add-manual"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </div>
          </Card>
        )}

        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <Button
                onClick={addItem}
                variant="outline"
                size="sm"
                data-testid="button-add-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        className="h-12 mb-2"
                        data-testid={`input-item-name-${index}`}
                      />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value) || 0)
                        }
                        className="h-12"
                        step="0.01"
                        min="0"
                        data-testid={`input-item-price-${index}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="flex-shrink-0"
                      data-testid={`button-remove-item-${index}`}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSave}
              disabled={createMenuMutation.isPending}
              className="w-full h-12"
              data-testid="button-save-menu"
            >
              {createMenuMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Menu
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <MenuCodeModal
        open={showModal}
        onOpenChange={setShowModal}
        code={menuCode}
        menuName={menuName}
      />
    </div>
  );
}
