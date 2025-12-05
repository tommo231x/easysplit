declare global {
  interface Window {
    firebase?: {
      analytics: () => {
        logEvent: (eventName: string, eventParams?: Record<string, unknown>) => void;
      };
    };
  }
}

export function logAnalyticsEvent(eventName: string, eventParams?: Record<string, unknown>) {
  try {
    if (window.firebase?.analytics) {
      window.firebase.analytics().logEvent(eventName, eventParams);
    }
  } catch (e) {
    console.debug("Analytics event failed:", eventName, e);
  }
}

export const AnalyticsEvents = {
  SPLIT_CREATED: "split_created",
  ITEM_ADDED: "item_added",
  ITEM_REMOVED: "item_removed",
  SHARE_OPENED: "share_opened",
  LINK_COPIED: "link_copied",
  SHARED_LINK_VISITED: "shared_link_visited",
} as const;
