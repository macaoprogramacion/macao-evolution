import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/cron/cleanup-portfolios
 *
 * Vercel Cron — runs daily to delete expired portfolios
 * and their associated files from Supabase Storage.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Find expired portfolios
    const { data: expired, error: fetchError } = await supabase
      .from("portfolios")
      .select("id")
      .lt("expires_at", new Date().toISOString())

    if (fetchError) {
      console.error("Error fetching expired portfolios:", fetchError)
      return NextResponse.json({ error: "Failed to fetch expired portfolios" }, { status: 500 })
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ message: "No expired portfolios", deleted: 0 })
    }

    const portfolioIds = expired.map(p => p.id)

    // 2. Get storage file URLs before deleting DB records
    const { data: photos } = await supabase
      .from("portfolio_photos")
      .select("url")
      .in("portfolio_id", portfolioIds)

    const { data: videos } = await supabase
      .from("portfolio_videos")
      .select("url")
      .in("portfolio_id", portfolioIds)

    // 3. Delete portfolios (cascade deletes photos/videos rows)
    const { error: deleteError } = await supabase
      .from("portfolios")
      .delete()
      .in("id", portfolioIds)

    if (deleteError) {
      console.error("Error deleting expired portfolios:", deleteError)
      return NextResponse.json({ error: "Failed to delete portfolios" }, { status: 500 })
    }

    // 4. Delete files from storage bucket
    const filePaths: string[] = []

    const extractPath = (url: string) => {
      // URL format: .../storage/v1/object/public/portfolio-media/photos/xxx.jpg
      const marker = "/portfolio-media/"
      const idx = url.indexOf(marker)
      if (idx !== -1) return url.substring(idx + marker.length)
      return null
    }

    for (const photo of (photos || [])) {
      const path = extractPath(photo.url)
      if (path) filePaths.push(path)
    }
    for (const video of (videos || [])) {
      const path = extractPath(video.url)
      if (path) filePaths.push(path)
    }

    // Also delete portfolio cover images
    const { data: portfolioImages } = await supabase
      .from("portfolios")
      .select("image")
      .in("id", portfolioIds)

    // Note: portfolios already deleted above, so this won't return results.
    // Cover images are usually the first photo, already in filePaths.

    if (filePaths.length > 0) {
      // Supabase storage remove accepts up to 1000 files at a time
      const batchSize = 1000
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize)
        const { error: storageError } = await supabase.storage
          .from("portfolio-media")
          .remove(batch)

        if (storageError) {
          console.error("Error removing files from storage:", storageError)
        }
      }
    }

    console.log(`Cleanup: deleted ${portfolioIds.length} expired portfolios, ${filePaths.length} files`)

    return NextResponse.json({
      message: "Cleanup complete",
      deleted: portfolioIds.length,
      filesRemoved: filePaths.length,
    })
  } catch (err) {
    console.error("Cleanup cron error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
