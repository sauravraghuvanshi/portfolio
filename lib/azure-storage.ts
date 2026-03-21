import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

let containerClient: ContainerClient | null = null;

function getContainerClient(): ContainerClient {
  if (containerClient) return containerClient;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";

  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  return containerClient;
}

/**
 * Upload a buffer to Azure Blob Storage.
 * @returns The direct public URL of the uploaded blob
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

  const baseUrl = process.env.NEXT_PUBLIC_AZURE_STORAGE_URL
    || `https://sauravportfoliomedia.blob.core.windows.net/blog-images`;

  return `${baseUrl}/${blobPath}`;
}
