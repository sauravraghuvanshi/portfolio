// One-time migration: upload existing blog images to Azure Blob Storage
// Run: node scripts/migrate-images-to-azure.mjs

import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageDir = path.join(__dirname, "..", "public", "blog", "images");

const accountName = "sauravportfolioblob";
const containerName = "blog-images";

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

async function migrate() {
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const files = fs.readdirSync(imageDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return MIME[ext];
  });

  console.log(`Found ${files.length} images to migrate.\n`);

  for (const file of files) {
    const filePath = path.join(imageDir, file);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const blobPath = `_legacy/${file}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    process.stdout.write(`  Uploading: ${file} ... `);
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "public, max-age=31536000, immutable",
      },
    });
    console.log("done");
  }

  console.log(`\nMigration complete!`);
  console.log(`Blob URL base: https://${accountName}.blob.core.windows.net/${containerName}/_legacy/`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
