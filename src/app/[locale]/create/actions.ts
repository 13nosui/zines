"use server";

import { createServerClient } from "@/lib/supabase/server";

export async function createPostAction(formData: FormData) {
  const supabase = createServerClient();

  // 1) 認証確認
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, error: `Not authenticated: ${userErr?.message ?? ""}` };
  }

  // 2) 入力取得
  const title = (formData.get("title") as string | null) ?? "";
  const body = (formData.get("body") as string | null) ?? "";
  const tagsRaw = (formData.get("tags") as string | null) ?? "";
  const files = formData.getAll("images") as File[];

  if (!files.length) {
    return { ok: false, error: "At least one image is required" };
  }

  // 3) 画像アップロード（最大3枚）
  const imageUrls: string[] = [];
  for (const file of files.slice(0, 3)) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `posts/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("posts")
      .upload(path, file, {
        contentType: file.type || undefined,
        cacheControl: "3600",
        upsert: false,
      });
    if (upErr) {
      return { ok: false, error: `Upload failed: ${upErr.message}` };
    }
    const { data } = supabase.storage.from("posts").getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  // 4) タグ整形
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  // 5) DB挿入（RLSチェック）
  const payload = {
    user_id: user.id, // 重要
    title: title || null,
    body: body || null,
    tags: tags.length ? tags : null,
    image_urls: imageUrls, // 必須
  };

  const { error: insErr } = await supabase.from("posts").insert(payload);

  if (insErr) {
    return {
      ok: false,
      error: `Insert failed: ${insErr.message}; payload=${JSON.stringify(
        payload
      )}; user=${user.id}`,
    };
  }

  return { ok: true };
}
