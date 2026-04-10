import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError } from "@/lib/gyg/config"

/* ────────────────────────────────────────────────────────────────
   GYG Supplier API – Main Router
   
   Maps GYG's expected path patterns to individual handlers.
   GYG calls: /api/gyg?action=<endpoint>
   
   Or use the dedicated endpoints directly:
     GET  /api/gyg/availability        → get-availabilities
     POST /api/gyg/reserve             → reserve
     POST /api/gyg/cancel-reservation  → cancel-reservation
     POST /api/gyg/book               → book
     POST /api/gyg/cancel-booking     → cancel-booking
     POST /api/gyg/notify             → notify
   ──────────────────────────────────────────────────────────────── */

// Import the individual handlers
import availabilityHandler from "./availability"
import reserveHandler from "./reserve"
import cancelReservationHandler from "./cancel-reservation"
import bookHandler from "./book"
import cancelBookingHandler from "./cancel-booking"
import notifyHandler from "./notify"

const handlers: Record<string, (req: NextApiRequest, res: NextApiResponse) => Promise<void>> = {
  "get-availabilities": availabilityHandler,
  availability: availabilityHandler,
  reserve: reserveHandler,
  "cancel-reservation": cancelReservationHandler,
  book: bookHandler,
  "cancel-booking": cancelBookingHandler,
  notify: notifyHandler,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure JSON content type on all responses
  res.setHeader("Content-Type", "application/json")

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  const action = req.query.action as string

  if (!action) {
    return res.status(200).json(
      gygError(
        "VALIDATION_FAILURE",
        "Missing 'action' query parameter. Use: get-availabilities, reserve, cancel-reservation, book, cancel-booking, notify."
      )
    )
  }

  const routeHandler = handlers[action]
  if (!routeHandler) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", `Unknown action '${action}'.`)
    )
  }

  // Delegate to the specific handler (auth is already validated)
  return routeHandler(req, res)
}
