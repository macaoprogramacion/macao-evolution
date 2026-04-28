import { supabase } from "@/lib/supabase";

export type GiftDraft = {
  receiverName?: string;
  receiverPhone?: string;
  receiverEmail?: string;
};

const GIFT_DRAFT_STATE_KEY = "gift_draft";

export async function loadGiftDraft(ownerEmail: string): Promise<GiftDraft | null> {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return null;

  const { data, error } = await supabase
    .from("customer_app_state")
    .select("payload")
    .eq("owner_email", email)
    .eq("state_key", GIFT_DRAFT_STATE_KEY)
    .maybeSingle();

  if (error || !data?.payload) return null;
  const payload = data.payload as GiftDraft;
  if (!payload.receiverName && !payload.receiverPhone && !payload.receiverEmail) return null;
  return payload;
}

export async function saveGiftDraft(ownerEmail: string, draft: GiftDraft): Promise<void> {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return;

  const { error } = await supabase.from("customer_app_state").upsert(
    {
      owner_email: email,
      state_key: GIFT_DRAFT_STATE_KEY,
      payload: draft,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_email,state_key" },
  );

  if (error) {
    console.error("Error saving gift draft:", error);
  }
}

export async function clearGiftDraft(ownerEmail: string): Promise<void> {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return;

  const { error } = await supabase
    .from("customer_app_state")
    .delete()
    .eq("owner_email", email)
    .eq("state_key", GIFT_DRAFT_STATE_KEY);

  if (error) {
    console.error("Error clearing gift draft:", error);
  }
}
