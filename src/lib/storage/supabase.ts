import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import type { StorageAdapter, UploadedFile } from "./index";
import { assertValidPhoto } from "./index";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "validation-photos";

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage non configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function extFromFilename(filename: string, mimeType: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

async function ensureBucket(supabase: SupabaseClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ],
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Impossible de créer le bucket Supabase : ${error.message}`);
  }
}

export const supabaseStorageAdapter: StorageAdapter = {
  async upload(file, options): Promise<UploadedFile> {
    assertValidPhoto(options.mimeType, file.byteLength);

    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);

    const folder = options.folder ?? "validations";
    const ext = extFromFilename(options.filename, options.mimeType);
    const key = `${folder}/${randomBytes(16).toString("hex")}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
      contentType: options.mimeType,
      upsert: false,
    });
    if (error) {
      throw new Error(`Upload photo échoué : ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);

    return {
      url: data.publicUrl,
      key,
      mimeType: options.mimeType,
      size: file.byteLength,
    };
  },

  async delete(key: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(BUCKET).remove([key]).catch(() => undefined);
  },
};
