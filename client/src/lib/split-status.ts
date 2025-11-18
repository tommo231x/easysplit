// Helper functions for managing split status (open/closed) in localStorage

export interface SplitStatus {
  code: string;
  status: "open" | "closed";
  savedAt: string;
}

const STORAGE_KEY = "easysplit-split-statuses";

export function getSplitStatus(code: string): "open" | "closed" {
  const statuses = getAllSplitStatuses();
  const status = statuses.find((s) => s.code === code);
  return status?.status || "open";
}

export function setSplitStatus(code: string, status: "open" | "closed"): void {
  const statuses = getAllSplitStatuses();
  const existingIndex = statuses.findIndex((s) => s.code === code);
  
  const newStatus: SplitStatus = {
    code,
    status,
    savedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    statuses[existingIndex] = newStatus;
  } else {
    statuses.push(newStatus);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  
  // Trigger storage event for cross-tab sync
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: STORAGE_KEY,
      newValue: JSON.stringify(statuses),
    })
  );
}

export function getAllSplitStatuses(): SplitStatus[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    
    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn("Invalid split statuses data, resetting");
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    // Validate each item has the required shape
    const validated = parsed.filter((item): item is SplitStatus => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof item.code === "string" &&
        (item.status === "open" || item.status === "closed") &&
        typeof item.savedAt === "string"
      );
    });
    
    // If we filtered out invalid items, save the cleaned data
    if (validated.length !== parsed.length) {
      console.warn(`Filtered ${parsed.length - validated.length} invalid split status entries`);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    }
    
    return validated;
  } catch (error) {
    console.error("Failed to parse split statuses, resetting:", error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function getOpenSplits(): string[] {
  const statuses = getAllSplitStatuses();
  return statuses.filter((s) => s.status === "open").map((s) => s.code);
}

export function removeSplitStatus(code: string): void {
  const statuses = getAllSplitStatuses();
  const filtered = statuses.filter((s) => s.code !== code);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
