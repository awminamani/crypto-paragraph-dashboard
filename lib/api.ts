export interface Monitor {
  id: string;
  name: string;
  source: "bitpin" | "frankfurter";
  code: string;
  label: string;
  enabled: boolean;
  sort_order: number;
  extra: {
    decimals?: number;
    unit?: string;
    show_change?: boolean;
    category?: string;
  };
  cached_price?: {
    price: number;
    change: number;
  } | null;
  cached_at?: number | null;
}

export interface Settings {
  telegraph_token: string;
  telegraph_path: string;
  telegraph_url: string;
  update_interval_minutes: string;
  template: string;
}

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("apiBaseUrl") || process.env.NEXT_PUBLIC_API_URL || "";
}

async function req<T>(method: string, path: string, body?: any): Promise<T> {
  const url = getBaseUrl() + path;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getMonitors: () => req<Monitor[]>("GET", "/api/monitors"),
  addMonitor: (m: Partial<Monitor>) => req("POST", "/api/monitors", m),
  deleteMonitor: (id: string) => req("DELETE", `/api/monitors/${id}`),
  toggleMonitor: (id: string, enabled: boolean) =>
    req("POST", `/api/toggle/${id}`, { enabled }),
  getPrices: () => req("GET", "/api/prices"),
  refreshPrices: () => req("POST", "/api/prices/refresh"),
  getTelegraphStatus: () =>
    req<{
      configured: boolean;
      has_page: boolean;
      url: string | null;
      path: string | null;
    }>("GET", "/api/telegraph/status"),
  createTelegraphAccount: (shortName: string) =>
    req("POST", "/api/telegraph/create_account", { short_name: shortName }),
  updateTelegraph: () =>
    req<{ success: boolean; url: string }>("POST", "/api/telegraph/update"),
  getSettings: () => req<Settings & Record<string, string>>("GET", "/api/settings"),
  saveSettings: (s: Record<string, string>) =>
    req("POST", "/api/settings", s),
};
