// One-time migration: upload existing event images from public/events/ to Azure Blob Storage
// Then update events.json and events-overrides.json with blob URLs
//
// Run: node --env-file=.env.local scripts/migrate-event-images.mjs
//
// Requires: AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER_NAME, NEXT_PUBLIC_AZURE_STORAGE_URL in .env.local

import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const eventsDir = path.join(ROOT, "public", "events");
const eventsJsonPath = path.join(ROOT, "content", "events.json");
const overridesJsonPath = path.join(ROOT, "content", "events-overrides.json");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";
const blobBaseUrl =
  process.env.NEXT_PUBLIC_AZURE_STORAGE_URL ||
  "https://sauravportfoliomedia.blob.core.windows.net/blog-images";

if (!connectionString) {
  console.error("ERROR: AZURE_STORAGE_CONNECTION_STRING not set. Add it to .env.local");
  process.exit(1);
}

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

async function migrate() {
  // Connect to blob storage
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Read event slug directories
  const slugDirs = fs
    .readdirSync(eventsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`Found ${slugDirs.length} event directories in public/events/\n`);

  // Build a map: old relative path → new blob URL
  const pathMap = {};
  let uploadCount = 0;

  for (const slug of slugDirs) {
    const slugDir = path.join(eventsDir, slug);
    const files = fs.readdirSync(slugDir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return !!MIME[ext];
    });

    if (files.length === 0) continue;

    for (const file of files) {
      const filePath = path.join(slugDir, file);
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const contentType = MIME[ext] || "application/octet-stream";

      // Upload to events/{slug}/{filename}
      const blobPath = `events/${slug}/${file}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

      process.stdout.write(`  Uploading: events/${slug}/${file} ... `);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobCacheControl: "public, max-age=31536000, immutable",
        },
      });
      console.log("done");

      // Map old path → new URL
      const oldPath = `/events/${slug}/${file}`;
      const newUrl = `${blobBaseUrl}/${blobPath}`;
      pathMap[oldPath] = newUrl;
      uploadCount++;
    }
  }

  console.log(`\nUploaded ${uploadCount} images.\n`);

  // --- Update events.json ---
  console.log("Updating content/events.json ...");
  const events = JSON.parse(fs.readFileSync(eventsJsonPath, "utf-8"));
  let eventsUpdated = 0;

  for (const event of events) {
    if (event.coverImage && pathMap[event.coverImage]) {
      event.coverImage = pathMap[event.coverImage];
      eventsUpdated++;
    }
    if (Array.isArray(event.images)) {
      event.images = event.images.map((img) => pathMap[img] || img);
    }
  }
  fs.writeFileSync(eventsJsonPath, JSON.stringify(events, null, 2) + "\n", "utf-8");
  console.log(`  Updated ${eventsUpdated} coverImage fields + image arrays.\n`);

  // --- Update events-overrides.json ---
  console.log("Updating content/events-overrides.json ...");
  const overrides = JSON.parse(fs.readFileSync(overridesJsonPath, "utf-8"));
  let overridesUpdated = 0;

  for (const [slug, data] of Object.entries(overrides)) {
    if (data.coverImage && pathMap[data.coverImage]) {
      data.coverImage = pathMap[data.coverImage];
      overridesUpdated++;
    }
    if (Array.isArray(data.images)) {
      data.images = data.images.map((img) => pathMap[img] || img);
    }
  }
  fs.writeFileSync(overridesJsonPath, JSON.stringify(overrides, null, 2) + "\n", "utf-8");
  console.log(`  Updated ${overridesUpdated} overrides coverImage fields + image arrays.\n`);

  // --- Summary ---
  console.log("=== Migration Complete ===");
  console.log(`  Images uploaded: ${uploadCount}`);
  console.log(`  events.json entries updated: ${eventsUpdated}`);
  console.log(`  events-overrides.json entries updated: ${overridesUpdated}`);
  console.log(`  Blob base URL: ${blobBaseUrl}/events/`);
  console.log(`\nNext steps:`);
  console.log(`  1. Run 'npm run build' to verify the site works`);
  console.log(`  2. Delete 'public/events/' directory`);
  console.log(`  3. Commit the changes`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
