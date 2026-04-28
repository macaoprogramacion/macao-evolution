import type { Representative } from "@/lib/sellers-data";

export type SellerPortalSession = Representative;

const SESSION_EVENT = "macao-sellers-session-changed";

export async function getSellerPortalSession(): Promise<SellerPortalSession | null> {
  try {
    const response = await fetch("/api/sellers-session", { method: "GET", credentials: "include" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { session?: SellerPortalSession | null };
    return payload.session || null;
  } catch {
    return null;
  }
}

export async function setSellerPortalSession(session: SellerPortalSession): Promise<boolean> {
  try {
    const response = await fetch("/api/sellers-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const ok = response.ok;
    if (ok && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EVENT));
    }
    return ok;
  } catch {
    return false;
  }
}

export async function clearSellerPortalSession(): Promise<void> {
  try {
    await fetch("/api/sellers-session", { method: "DELETE", credentials: "include" });
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EVENT));
    }
  }
}
