import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/download?url=<encoded_url>&filename=<encoded_filename>
 *
 * Proxies a file download from Supabase Storage (or any public URL)
 * to avoid CORS issues and ensures the browser triggers a download
 * with the correct filename via Content-Disposition header.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, filename } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // Only allow downloading from our own Supabase storage
  const allowedHosts = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ].filter(Boolean);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const isAllowed = allowedHosts.some(
    (host) => host && parsedUrl.origin === new URL(host).origin
  );

  if (!isAllowed) {
    return res.status(403).json({ error: "URL not allowed" });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch file" });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const safeName = typeof filename === "string" ? filename.replace(/[^a-zA-Z0-9._-]/g, "_") : "download";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("Download proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
