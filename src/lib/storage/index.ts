/**
 * Abstraction stockage photos.
 * Dev : local filesystem
 * Prod : Cloudinary | Azure Blob | S3 (à brancher via STORAGE_PROVIDER)
 */

export type StorageProvider = "local" | "cloudinary" | "azure" | "s3";

export interface UploadedFile {
  url: string;
  key: string;
  mimeType: string;
  size: number;
}

export interface StorageAdapter {
  upload(
    file: Buffer,
    options: { filename: string; mimeType: string; folder?: string },
  ): Promise<UploadedFile>;
  delete(key: string): Promise<void>;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export function assertValidPhoto(mimeType: string, size: number) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error(
      "Format de photo non supporté. Utilisez JPEG, PNG ou WebP.",
    );
  }
  if (size > MAX_PHOTO_BYTES) {
    throw new Error("La photo est trop lourde (maximum 5 Mo).");
  }
}

export function getStorageProvider(): StorageProvider {
  const value = (process.env.STORAGE_PROVIDER ?? "local") as StorageProvider;
  return value;
}

/** Adapters locaux / cloud selon STORAGE_PROVIDER. */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  const provider = getStorageProvider();

  if (provider === "local") {
    const { localStorageAdapter } = await import("./local");
    return localStorageAdapter;
  }

  throw new Error(
    `Fournisseur de stockage « ${provider} » non encore configuré.`,
  );
}
