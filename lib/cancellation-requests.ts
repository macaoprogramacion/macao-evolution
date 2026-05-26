import { supabase } from "@/lib/supabase"

export type CancellationRequestStatus = "pending" | "approved" | "rejected"
export type CancellationOperationType = "buggy" | "saona" | "samana"

export type CancellationRequest = {
  id: string
  operationType: CancellationOperationType
  reservationId: string
  customerName: string
  reason: string
  requestedAt: string
  requestedBy?: string
  status: CancellationRequestStatus
  accountingNote?: string
}

type CancellationRequestRow = {
  id: string
  operation_type: CancellationOperationType
  reservation_id: string
  customer_name: string
  reason: string
  requested_at: string
  requested_by: string | null
  status: CancellationRequestStatus
  accounting_note: string | null
}

function mapRow(row: CancellationRequestRow): CancellationRequest {
  return {
    id: row.id,
    operationType: row.operation_type,
    reservationId: row.reservation_id,
    customerName: row.customer_name,
    reason: row.reason,
    requestedAt: row.requested_at,
    requestedBy: row.requested_by || undefined,
    status: row.status,
    accountingNote: row.accounting_note || undefined,
  }
}

export async function listCancellationRequests() {
  const { data, error } = await supabase
    .from("reservation_cancellation_requests")
    .select("id, operation_type, reservation_id, customer_name, reason, requested_at, requested_by, status, accounting_note")
    .order("requested_at", { ascending: false })

  if (error) throw error
  return (data || []).map((row) => mapRow(row as CancellationRequestRow))
}

export async function upsertCancellationRequest(request: CancellationRequest) {
  const payload = {
    id: request.id,
    operation_type: request.operationType,
    reservation_id: request.reservationId,
    customer_name: request.customerName,
    reason: request.reason,
    requested_at: request.requestedAt,
    requested_by: request.requestedBy || null,
    status: request.status,
    accounting_note: request.accountingNote || null,
  }

  const { data, error } = await supabase
    .from("reservation_cancellation_requests")
    .upsert(payload, { onConflict: "id" })
    .select("id, operation_type, reservation_id, customer_name, reason, requested_at, requested_by, status, accounting_note")
    .single()

  if (error) throw error
  return mapRow(data as CancellationRequestRow)
}

export async function updateCancellationRequestDecision(
  id: string,
  status: Exclude<CancellationRequestStatus, "pending">,
  accountingNote?: string,
  resolvedBy?: string,
) {
  const { data, error } = await supabase
    .from("reservation_cancellation_requests")
    .update({
      status,
      accounting_note: accountingNote || null,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy || null,
    })
    .eq("id", id)
    .select("id, operation_type, reservation_id, customer_name, reason, requested_at, requested_by, status, accounting_note")
    .single()

  if (error) throw error
  return mapRow(data as CancellationRequestRow)
}
