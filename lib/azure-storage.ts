import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

let containerClient: ContainerClient | null = null;

function getContainerClient(): ContainerClient {
  if (containerClient) return containerClient;

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";

  if (!accountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME is not configured");
  }

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );
  containerClient = blobServiceClient.getContainerClient(containerName);
  return containerClient;
}

/**
 * Upload a buffer to Azure Blob Storage.
 * @returns A proxy URL path like /api/images/<blobPath>
 */
export async function uploadToBlob(
  blobPath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(blobPath);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: "public, max-age=31536000, immutable",
    },
  });

  return `/api/images/${blobPath}`;
}

/**
 * Download a blob and return its buffer + content type.
 */
export async function downloadBlob(
  blobPath: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(blobPath);

  try {
    const response = await blockBlobClient.download(0);
    const chunks: Buffer[] = [];
    if (response.readableStreamBody) {
      for await (const chunk of response.readableStreamBody) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    }
    return {
      buffer: Buffer.concat(chunks),
      contentType: response.contentType || "application/octet-stream",
    };
  } catch {
    return null;
  }
}
