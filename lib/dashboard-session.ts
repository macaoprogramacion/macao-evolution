export type DashboardSession = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  avatar_url?: string | null;
  active: boolean;
  issuedAt?: string;
  expiresAt?: string;
};

const DASHBOARD_EVENT = "macao-dashboard-session-changed";

export async function getDashboardSession(): Promise<DashboardSession | null> {
  try {
    const response = await fetch("/api/dashboard-session", { method: "GET", credentials: "include" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { session?: DashboardSession | null };
    return payload.session || null;
  } catch {
    return null;
  }
}

export async function setDashboardSession(session: DashboardSession): Promise<boolean> {
  try {
    const response = await fetch("/api/dashboard-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const ok = response.ok;
    if (ok && typeof window !== "undefined") {
      window.dispatchEvent(new Event(DASHBOARD_EVENT));
    }
    return ok;
  } catch {
    return false;
  }
}

export async function clearDashboardSession(): Promise<void> {
  try {
    await fetch("/api/dashboard-session", { method: "DELETE", credentials: "include" });
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DASHBOARD_EVENT));
    }
  }
}
