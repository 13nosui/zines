"use server";

import { createServerClient } from "@/lib/supabase/server";

export async function createPostAction(formData: FormData) {
  const supabase = createServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const title = (formData.get("title") as string | null) ?? "";
  const body = (formData.get("body") as string | null) ?? "";
  const tagsRaw = (formData.get("tags") as string | null) ?? "";
  const files = formData.getAll("images") as File[];

  // 画像は必須（1〜3枚）
  if (!files.length)
    return { ok: false, error: "At least one image is required" };
  const selected = files.slice(0, 3);

  // アップロード
  const imageUrls: string[] = [];
  for (const file of selected) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `posts/${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("posts")
      .upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
        cacheControl: "3600",
      });
    if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

    // 公開バケット想定
    const { data } = supabase.storage.from("posts").getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  // タグ整形（最大10件）
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  // DB挿入（RLS: auth.uid() = user_id）
  const { error: insErr } = await supabase.from("posts").insert({
    user_id: user.id,
    title: title || null,
    body: body || null,
    tags: tags.length ? tags : null,
    image_urls: imageUrls,
  });

  if (insErr) return { ok: false, error: insErr.message };

  return { ok: true };
}
