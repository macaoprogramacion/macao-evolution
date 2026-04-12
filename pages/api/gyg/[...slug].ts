import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError } from "@/lib/gyg/config"
import { logWebhookRequest, markWebhookSuccess, markWebhookFailed } from "@/lib/gyg/webhook-logger"
import availabilityHandler from "./availability"
import reserveHandler from "./reserve"
import cancelReservationHandler from "./cancel-reservation"
import bookHandler from "./book"
import cancelBookingHandler from "./cancel-booking"
import notifyHandler from "./notify"

/* ────────────────────────────────────────────────────────────────
   GYG Supplier API – Path-based Router
   
   Matches GetYourGuide's standard URL patterns:
     GET  /api/gyg/1/get-availabilities/
     POST /api/gyg/1/reserve/
     POST /api/gyg/1/cancel-reservation/
     POST /api/gyg/1/book/
     POST /api/gyg/1/cancel-booking/
     POST /api/gyg/1/notify/
   ──────────────────────────────────────────────────────────────── */

const routeMap: Record<string, (req: NextApiRequest, res: NextApiResponse) => Promise<void>> = {
  "get-availabilities": availabilityHandler,
  reserve: reserveHandler,
  "cancel-reservation": cancelReservationHandler,
  book: bookHandler,
  "cancel-booking": cancelBookingHandler,
  notify: notifyHandler,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json")

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  const slugs = req.query.slug
  if (!Array.isArray(slugs) || slugs.length < 2) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", "Invalid API path. Expected /api/gyg/1/<endpoint>/")
    )
  }

  // slugs[0] = "1" (API version), slugs[1] = endpoint name
  const version = slugs[0]
  const endpoint = slugs[1]

  if (version !== "1") {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", `Unsupported API version '${version}'. Use version '1'.`)
    )
  }

  const routeHandler = routeMap[endpoint]
  if (!routeHandler) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", `Unknown endpoint '${endpoint}'.`)
    )
  }

  // Log the incoming request (non-blocking for GET availability)
  const shouldLog = req.method === "POST"
  const logId = shouldLog ? await logWebhookRequest(endpoint, req) : null

  // Intercept res.json to capture response body
  const origJson = res.json.bind(res)
  let capturedBody: any
  res.json = (body: any) => {
    capturedBody = body
    return origJson(body)
  }

  try {
    await routeHandler(req, res)
    if (logId) {
      if (capturedBody?.errorCode) {
        markWebhookFailed(logId, capturedBody, capturedBody.errorMessage)
      } else {
        markWebhookSuccess(logId, capturedBody)
      }
    }
  } catch (err: any) {
    if (logId) {
      markWebhookFailed(logId, capturedBody, err.message)
    }
    if (!res.headersSent) {
      return res.status(200).json(
        gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error in route handler.")
      )
    }
  }
}
