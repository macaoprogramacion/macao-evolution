import { supabase } from "@/lib/supabase"

export interface PhotoSaleEventInput {
  eventType: "online_purchase" | "download" | "invoice_redeemed"
  phone?: string | null
  clientName?: string | null
  invoiceNumber?: string | null
  planName?: string | null
  amount?: number
  currency?: string
  source?: string | null
  metadata?: Record<string, unknown>
}

export async function findInvoicesByPhoneFromDb(phone: string) {
  const normalized = String(phone || "").replace(/\D/g, "")
  if (!normalized) return []

  const { data, error } = await supabase
    .from("photo_invoices")
    .select("invoice_number, client_name, client_phone, total, currency, redeemed, redeemed_at, created_at")
    .eq("status", "active")

  if (error) {
    console.error("[photography-db] findInvoicesByPhoneFromDb:", error.message)
    return []
  }

  return (data || []).filter((row) => String(row.client_phone || "").replace(/\D/g, "") === normalized)
}

export async function findInvoiceByNumberFromDb(invoiceNumber: string) {
  const code = String(invoiceNumber || "").trim().toUpperCase()
  if (!code) return null

  const { data, error } = await supabase
    .from("photo_invoices")
    .select("invoice_number, client_name, client_phone, total, currency, redeemed, redeemed_at, created_at")
    .eq("invoice_number", code)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[photography-db] findInvoiceByNumberFromDb:", error.message)
    return null
  }

  return data || null
}

export async function markInvoiceRedeemedInDb(invoiceNumber: string) {
  const code = String(invoiceNumber || "").trim().toUpperCase()
  if (!code) return false

  const { error } = await supabase
    .from("photo_invoices")
    .update({ redeemed: true, redeemed_at: new Date().toISOString() })
    .eq("invoice_number", code)

  if (error) {
    console.error("[photography-db] markInvoiceRedeemedInDb:", error.message)
    return false
  }

  return true
}

export async function addPhotoSaleEvent(input: PhotoSaleEventInput) {
  const payload = {
    event_type: input.eventType,
    phone: input.phone || null,
    client_name: input.clientName || null,
    invoice_number: input.invoiceNumber || null,
    plan_name: input.planName || null,
    amount: Number(input.amount || 0),
    currency: input.currency || "USD",
    source: input.source || null,
    metadata: input.metadata || {},
  }

  const { error } = await supabase.from("photo_sales_events").insert(payload)
  if (error) {
    console.error("[photography-db] addPhotoSaleEvent:", error.message)
    return false
  }

  return true
}

export async function getPhotoSalesEvents() {
  const { data, error } = await supabase
    .from("photo_sales_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000)

  if (error) {
    console.error("[photography-db] getPhotoSalesEvents:", error.message)
    return []
  }

  return data || []
}

export async function saveDailyClosure(params: {
  closureDate: string
  closedBy?: string | null
  totalInvoices: number
  byCurrency: Record<string, { total: number; subtotal: number; tax: number; count: number }>
  disableTaxAfterClose?: boolean
}) {
  const { error } = await supabase
    .from("photo_daily_closures")
    .upsert(
      {
        closure_date: params.closureDate,
        closed_by: params.closedBy || null,
        total_invoices: params.totalInvoices,
        by_currency: params.byCurrency,
        disable_tax_after_close: params.disableTaxAfterClose !== false,
        closed_at: new Date().toISOString(),
      },
      { onConflict: "closure_date" },
    )

  if (error) {
    console.error("[photography-db] saveDailyClosure:", error.message)
    return false
  }

  return true
}

export async function getLatestDailyClosure() {
  const { data, error } = await supabase
    .from("photo_daily_closures")
    .select("*")
    .order("closure_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[photography-db] getLatestDailyClosure:", error.message)
    return null
  }

  return data || null
}

export async function getPhotoExchangeRates() {
  const { data, error } = await supabase
    .from("photo_exchange_rates")
    .select("currency_code, rate_to_dop")
    .eq("active", true)

  if (error) {
    console.error("[photography-db] getPhotoExchangeRates:", error.message)
    return { USD: 60, EUR: 65 }
  }

  const rates = { USD: 60, EUR: 65 }
  ;(data || []).forEach((row) => {
    if (row.currency_code) {
      rates[String(row.currency_code).toUpperCase()] = Number(row.rate_to_dop || 0)
    }
  })

  return rates
}

export async function savePhotoExchangeRates(rates: Record<string, number>, updatedBy?: string | null) {
  const rows = Object.entries(rates).map(([currencyCode, rateToDop]) => ({
    currency_code: currencyCode.toUpperCase(),
    rate_to_dop: Number(rateToDop || 0),
    updated_by: updatedBy || null,
    active: true,
  }))

  const { error } = await supabase
    .from("photo_exchange_rates")
    .upsert(rows, { onConflict: "currency_code" })

  if (error) {
    console.error("[photography-db] savePhotoExchangeRates:", error.message)
    return false
  }

  return true
}
