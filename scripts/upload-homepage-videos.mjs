import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_BUCKET = "portfolio-media";
const DEFAULT_VIDEOS_DIR = path.join("public", "images", "videos");
const MEDIA_SYNC_FLAG = "SYNC_HOMEPAGE_MEDIA";

const HOMEPAGE_SLOT_BY_FILE = {
  "lateral-izquierdo.mp4": {
    slot: "macao-beach",
    title: "Macao Beach",
    description: "Vive la experiencia en los caminos de Macao",
    sortOrder: 1,
  },
  "lateral-derecho.mp4": {
    slot: "horseback-riding",
    title: "Horseback Riding",
    description: "Descubre los mejores paisajes en buggy",
    sortOrder: 2,
  },
  "macao-rancho.mp4": {
    slot: "featured-large",
    title: "Adventure Experience",
    description: null,
    sortOrder: 3,
  },
};

function toMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function parseRequestedFiles() {
  const filesFromEnv = readEnv("HOMEPAGE_VIDEO_FILES");
  if (!filesFromEnv) return null;

  const requested = filesFromEnv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return requested.length > 0 ? new Set(requested) : null;
}

async function listVideoFiles(videosDir) {
  const entries = await fs.readdir(videosDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.mp4$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return files;
}

function buildSupabaseClient() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL") || readEnv("SUPABASE_URL");
  const supabaseKey =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readEnv("SUPABASE_ANON_KEY");

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL).");
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function uploadFile({ supabase, bucket, videosDir, fileName }) {
  const absolutePath = path.join(videosDir, fileName);
  const fileBuffer = await fs.readFile(absolutePath);
  const storagePath = `videos/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    upsert: true,
    cacheControl: "31536000",
    contentType: "video/mp4",
  });

  if (error) {
    throw new Error(`Upload failed for ${fileName}: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    fileName,
    storagePath,
    publicUrl: data.publicUrl,
  };
}

async function syncHomepageMediaRows({ supabase, uploadedFiles }) {
  const rows = uploadedFiles
    .map((item) => {
      const slotInfo = HOMEPAGE_SLOT_BY_FILE[item.fileName];
      if (!slotInfo) return null;

      return {
        slot: slotInfo.slot,
        title: slotInfo.title,
        description: slotInfo.description,
        storage_path: item.storagePath,
        sort_order: slotInfo.sortOrder,
        active: true,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return { synced: false, rows: 0 };
  }

  const { error } = await supabase.from("homepage_media").upsert(rows, { onConflict: "slot" });

  if (error) {
    throw new Error(`Failed syncing homepage_media rows: ${error.message}`);
  }

  return { synced: true, rows: rows.length };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const bucket = readEnv("SUPABASE_STORAGE_BUCKET") || DEFAULT_BUCKET;
  const videosDir = path.resolve(process.cwd(), DEFAULT_VIDEOS_DIR);
  const requestedFiles = parseRequestedFiles();

  const allVideoFiles = await listVideoFiles(videosDir);
  const selectedFiles = requestedFiles
    ? allVideoFiles.filter((fileName) => requestedFiles.has(fileName))
    : allVideoFiles;

  if (selectedFiles.length === 0) {
    throw new Error("No .mp4 files found to upload in public/images/videos.");
  }

  console.log(`Videos directory: ${videosDir}`);
  console.log(`Bucket: ${bucket}`);
  console.log(`Files to process (${selectedFiles.length}):`);

  for (const fileName of selectedFiles) {
    const absolutePath = path.join(videosDir, fileName);
    const stats = await fs.stat(absolutePath);
    console.log(`- ${fileName} (${toMB(stats.size)} MB)`);
  }

  if (dryRun) {
    console.log("\nDry run complete. No files were uploaded.");
    return;
  }

  const supabase = buildSupabaseClient();
  const uploadedFiles = [];

  for (const fileName of selectedFiles) {
    console.log(`\nUploading ${fileName}...`);
    const uploaded = await uploadFile({ supabase, bucket, videosDir, fileName });
    uploadedFiles.push(uploaded);
    console.log(`Uploaded: ${uploaded.storagePath}`);
  }

  const shouldSyncMedia = readEnv(MEDIA_SYNC_FLAG).toLowerCase() === "true";

  if (shouldSyncMedia) {
    const syncResult = await syncHomepageMediaRows({ supabase, uploadedFiles });
    if (syncResult.synced) {
      console.log(`\nSynced homepage_media rows: ${syncResult.rows}`);
    } else {
      console.log("\nNo homepage_media rows matched the uploaded filenames.");
    }
  } else {
    console.log(
      `\nSkipping homepage_media sync. Set ${MEDIA_SYNC_FLAG}=true to enable slot upsert.`,
    );
  }

  console.log("\nUpload completed.");
}

main().catch((error) => {
  console.error("\nUpload script failed:", error.message);
  process.exit(1);
});
