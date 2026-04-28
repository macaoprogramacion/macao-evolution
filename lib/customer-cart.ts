import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/context/cart-context";

const CART_STATE_KEY = "cart";

export async function loadCustomerCart(ownerEmail: string): Promise<CartItem[]> {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return [];

  const { data, error } = await supabase
    .from("customer_app_state")
    .select("payload")
    .eq("owner_email", email)
    .eq("state_key", CART_STATE_KEY)
    .maybeSingle();

  if (error || !data?.payload) return [];
  const items = (data.payload as { items?: CartItem[] }).items;
  return Array.isArray(items) ? items : [];
}

export async function saveCustomerCart(ownerEmail: string, items: CartItem[]): Promise<void> {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return;

  const { error } = await supabase.from("customer_app_state").upsert(
    {
      owner_email: email,
      state_key: CART_STATE_KEY,
      payload: { items },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_email,state_key" },
  );

  if (error) {
    console.error("Error saving customer cart:", error);
  }
}
