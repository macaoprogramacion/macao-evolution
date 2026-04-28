export type CustomerSession = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "cliente" | "representante";
  loggedInAt: string;
};

const AUTH_EVENT = "macao-auth-changed";

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const response = await fetch("/api/customer-session", { method: "GET", credentials: "include" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { session?: CustomerSession | null };
    return payload.session || null;
  } catch {
    return null;
  }
}

export async function setCustomerSession(session: CustomerSession): Promise<boolean> {
  try {
    const response = await fetch("/api/customer-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });

    const ok = response.ok;
    if (ok && typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
    return ok;
  } catch {
    return false;
  }
}

export async function clearCustomerSession(): Promise<void> {
  try {
    await fetch("/api/customer-session", { method: "DELETE", credentials: "include" });
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
  }
}
