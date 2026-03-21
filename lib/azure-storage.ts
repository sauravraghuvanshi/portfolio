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
 * @returns The full public URL of the uploaded blob
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

  const baseUrl =
    process.env.NEXT_PUBLIC_AZURE_STORAGE_URL ||
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images"}`;

  return `${baseUrl}/${blobPath}`;
}
