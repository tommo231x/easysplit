import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, Plus, X, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertMenuItem } from "@shared/schema";
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

export default function EditMenu() {
  const [, params] = useRoute("/edit-menu/:code");
  const code = params?.code?.toUpperCase() || "";
  const [, setLocation] = useLocation();
  const [menuName, setMenuName] = useState("");
  const [items, setItems] = useState<InsertMenuItem[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ menu: { name: string | null }; items: Array<{ name: string; price: number }> }>({
    queryKey: ["/api/menus", code],
    queryFn: async () => {
      const response = await fetch(`/api/menus/${code}`);
      if (!response.ok) {
        throw new Error("Menu not found");
      }
      return response.json();
    },
    enabled: code.length === 6,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setMenuName(data.menu.name || "");
      setItems(data.items.map((item) => ({ name: item.name, price: item.price })));
    }
  }, [data]);

  const updateMenuMutation = useMutation({
    mutationFn: async (payload: { name?: string; items: InsertMenuItem[] }) => {
      const response = await apiRequest("PATCH", `/api/menus/${code}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Menu updated!",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menus", code] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update menu. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/menus/${code}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      const ownedMenus = JSON.parse(localStorage.getItem("easysplit-menus") || "[]");
      const updated = ownedMenus.filter((c: string) => c !== code);
      localStorage.setItem("easysplit-menus", JSON.stringify(updated));
      
      toast({
        title: "Menu deleted",
        description: "The menu has been removed",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete menu. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const validItems = items.filter((item) => item.name && item.price > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "No valid items",
        description: "Add at least one item with a name and price",
        variant: "destructive",
      });
      return;
    }

    updateMenuMutation.mutate({
      name: menuName || undefined,
      items: validItems,
    });
  };

  const handleDelete = () => {
    deleteMenuMutation.mutate();
  };

  const addItem = () => {
    setItems([...items, { name: "", price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "name" | "price", value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-2xl p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Menu not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Edit Menu</h1>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="menu-name">Menu Name (Optional)</Label>
          <Input
            id="menu-name"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="e.g., Pizza Palace"
            data-testid="input-menu-name"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Menu Items</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addItem}
              data-testid="button-add-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="Item name"
                  data-testid={`input-item-name-${index}`}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={item.price || ""}
                  onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  data-testid={`input-item-price-${index}`}
                  className="w-24"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  data-testid={`button-remove-item-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={updateMenuMutation.isPending}
            className="flex-1"
            data-testid="button-save"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMenuMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMenuMutation.isPending}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this menu? This action cannot be undone and the menu code will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
