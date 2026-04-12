import { supabase } from "@/lib/supabase"
import type { NextApiRequest } from "next"

/**
 * Logs incoming GYG webhook requests BEFORE processing.
 * Returns a log ID so the result can be updated after processing.
 */
export async function logWebhookRequest(
  endpoint: string,
  req: NextApiRequest
): Promise<string | null> {
  try {
    const body = req.body
    const { data } = await supabase
      .from("gyg_webhook_log")
      .insert({
        endpoint,
        method: req.method || "POST",
        request_body: body || null,
        product_id: body?.data?.productId || null,
        gyg_booking_ref: body?.data?.gygBookingReference || null,
        processing_status: "processing",
      })
      .select("id")
      .single()
    return data?.id || null
  } catch {
    return null
  }
}

export async function markWebhookSuccess(logId: string | null, responseBody?: any) {
  if (!logId) return
  try {
    await supabase
      .from("gyg_webhook_log")
      .update({
        processing_status: "success",
        response_body: responseBody || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", logId)
  } catch {}
}

export async function markWebhookFailed(
  logId: string | null,
  responseBody?: any,
  errorMessage?: string
) {
  if (!logId) return
  try {
    await supabase
      .from("gyg_webhook_log")
      .update({
        processing_status: "failed",
        response_body: responseBody || null,
        error_message: errorMessage || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", logId)
  } catch {}
}
