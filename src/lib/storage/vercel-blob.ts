import { put, del } from "@vercel/blob";
import { randomBytes } from "crypto";
import type { StorageAdapter, UploadedFile } from "./index";
import { assertValidPhoto } from "./index";

function extFromFilename(filename: string, mimeType: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

export const vercelBlobStorageAdapter: StorageAdapter = {
  async upload(file, options): Promise<UploadedFile> {
    assertValidPhoto(options.mimeType, file.byteLength);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN manquant. Créez un Blob Store dans Vercel.",
      );
    }

    const folder = options.folder ?? "photos";
    const ext = extFromFilename(options.filename, options.mimeType);
    const pathname = `${folder}/${randomBytes(16).toString("hex")}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: options.mimeType,
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      key: blob.pathname,
      mimeType: options.mimeType,
      size: file.byteLength,
    };
  },

  async delete(key: string): Promise<void> {
    await del(key).catch(() => undefined);
  },
};
