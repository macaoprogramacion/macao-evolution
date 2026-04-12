import { NextResponse } from "next/server"

/**
 * GET /api/cron/gyg-sync
 *
 * Vercel Cron handler — runs automatically to retry failed GYG webhooks
 * and reconcile orphaned bookings.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Determine the base URL for the internal sync call
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    const response = await fetch(`${baseUrl}/api/gyg/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.GYG_INTERNAL_SECRET || "",
      },
    })

    const data = await response.json()

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      syncResult: data,
    })
  } catch (err: any) {
    console.error("[GYG Cron Sync Error]", err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
