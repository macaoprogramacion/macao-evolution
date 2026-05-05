import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError } from "@/lib/gyg/config"
import { logWebhookRequest, markWebhookSuccess, markWebhookFailed } from "@/lib/gyg/webhook-logger"
import availabilityHandler from "./availability"
import reserveHandler from "./reserve"
import cancelReservationHandler from "./cancel-reservation"
import bookHandler from "./book"
import cancelBookingHandler from "./cancel-booking"
import notifyHandler from "./notify"
import productListHandler from "./product-list"
import productDetailsHandler from "./product-details"
import addonsHandler from "./addons"
import pricingCategoriesHandler from "./pricing-categories"

/* ────────────────────────────────────────────────────────────────
   GYG Supplier API – Path-based Router
   
   Matches GetYourGuide's standard URL patterns:
     GET  /api/gyg/1/get-availabilities/
     POST /api/gyg/1/reserve/
     POST /api/gyg/1/cancel-reservation/
     POST /api/gyg/1/book/
     POST /api/gyg/1/cancel-booking/
     POST /api/gyg/1/notify/
     GET  /api/gyg/1/suppliers/{supplierId}/products/
     GET  /api/gyg/1/products/{productId}
     GET  /api/gyg/1/products/{productId}/addons/
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
  try {
    return await _handler(req, res)
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(200).json(gygError("INTERNAL_SYSTEM_FAILURE", err?.message || "Unexpected server error."))
    }
  }
}

async function _handler(req: NextApiRequest, res: NextApiResponse) {
  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  const slugs = req.query.slug
  if (!Array.isArray(slugs) || slugs.length < 2) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", "Invalid API path. Expected /api/gyg/1/<endpoint>/")
    )
  }

  // slugs[0] = "1" (API version), slugs[1+] = endpoint segments
  const version = slugs[0]

  if (version !== "1") {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", `Unsupported API version '${version}'. Use version '1'.`)
    )
  }

  // ── Multi-segment routes ──────────────────────────────────────────────
  // GET /1/suppliers/{supplierId}/products/
  if (slugs[1] === "suppliers" && slugs.length >= 4 && slugs[3] === "products") {
    req.query.supplierId = slugs[2]
    const shouldLog = req.method === "POST"
    const logId = shouldLog ? await logWebhookRequest("suppliers/products", req) : null
    const origJson = res.json.bind(res)
    let capturedBody: any
    res.json = (body: any) => { capturedBody = body; return origJson(body) }
    try {
      await productListHandler(req, res)
      if (logId) { capturedBody?.errorCode ? markWebhookFailed(logId, capturedBody, capturedBody.errorMessage) : markWebhookSuccess(logId, capturedBody) }
    } catch (err: any) {
      if (logId) markWebhookFailed(logId, capturedBody, err.message)
      if (!res.headersSent) return res.status(200).json(gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error."))
    }
    return
  }

  // GET /1/products/{productId}/addons/
  if (slugs[1] === "products" && slugs.length >= 4 && slugs[3] === "addons") {
    req.query.productId = slugs[2]
    const shouldLog = req.method === "POST"
    const logId = shouldLog ? await logWebhookRequest("products/addons", req) : null
    const origJson = res.json.bind(res)
    let capturedBody: any
    res.json = (body: any) => { capturedBody = body; return origJson(body) }
    try {
      await addonsHandler(req, res)
      if (logId) { capturedBody?.errorCode ? markWebhookFailed(logId, capturedBody, capturedBody.errorMessage) : markWebhookSuccess(logId, capturedBody) }
    } catch (err: any) {
      if (logId) markWebhookFailed(logId, capturedBody, err.message)
      if (!res.headersSent) return res.status(200).json(gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error."))
    }
    return
  }

  // GET /1/products/{productId}/pricing-categories
  if (slugs[1] === "products" && slugs.length >= 4 && slugs[3] === "pricing-categories") {
    req.query.productId = slugs[2]
    const shouldLog = req.method === "POST"
    const logId = shouldLog ? await logWebhookRequest("products/pricing-categories", req) : null
    const origJson = res.json.bind(res)
    let capturedBody: any
    res.json = (body: any) => { capturedBody = body; return origJson(body) }
    try {
      await pricingCategoriesHandler(req, res)
      if (logId) { capturedBody?.errorCode ? markWebhookFailed(logId, capturedBody, capturedBody.errorMessage) : markWebhookSuccess(logId, capturedBody) }
    } catch (err: any) {
      if (logId) markWebhookFailed(logId, capturedBody, err.message)
      if (!res.headersSent) return res.status(200).json(gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error."))
    }
    return
  }

  // GET /1/products/{productId}
  if (slugs[1] === "products" && slugs.length >= 3) {
    req.query.productId = slugs[2]
    const shouldLog = req.method === "POST"
    const logId = shouldLog ? await logWebhookRequest("products/details", req) : null
    const origJson = res.json.bind(res)
    let capturedBody: any
    res.json = (body: any) => { capturedBody = body; return origJson(body) }
    try {
      await productDetailsHandler(req, res)
      if (logId) { capturedBody?.errorCode ? markWebhookFailed(logId, capturedBody, capturedBody.errorMessage) : markWebhookSuccess(logId, capturedBody) }
    } catch (err: any) {
      if (logId) markWebhookFailed(logId, capturedBody, err.message)
      if (!res.headersSent) return res.status(200).json(gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error."))
    }
    return
  }

  // ── Simple single-segment routes ──────────────────────────────────────
  const endpoint = slugs[1]
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
