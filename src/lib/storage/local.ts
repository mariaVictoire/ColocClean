import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { StorageAdapter, UploadedFile } from "./index";
import { assertValidPhoto } from "./index";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "photos");

export const localStorageAdapter: StorageAdapter = {
  async upload(file, options): Promise<UploadedFile> {
    assertValidPhoto(options.mimeType, file.byteLength);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = options.filename.split(".").pop() ?? "jpg";
    const key = `${randomBytes(16).toString("hex")}.${ext}`;
    const fullPath = path.join(UPLOAD_DIR, key);
    await writeFile(fullPath, file);

    return {
      url: `/uploads/photos/${key}`,
      key,
      mimeType: options.mimeType,
      size: file.byteLength,
    };
  },

  async delete(key: string): Promise<void> {
    const fullPath = path.join(UPLOAD_DIR, key);
    await unlink(fullPath).catch(() => undefined);
  },
};
