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
  const titleRaw = (formData.get("title") as string | null) ?? "";
  const bodyRaw = (formData.get("body") as string | null) ?? "";
  const tagsRaw = (formData.get("tags") as string | null) ?? "";
  const files = formData.getAll("images") as File[];

  if (!files.length) {
    return { ok: false, error: "At least one image is required" };
  }

  // 3) 画像アップロード（1枚のみ）
  const imageUrls: string[] = [];
  for (const file of files.slice(0, 1)) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

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

  if (!Array.isArray(imageUrls) || imageUrls.length < 1) {
    return { ok: false, error: "No imageUrls after upload" };
  }
  if (imageUrls.length > 1) {
    return { ok: false, error: "Only one image is allowed" };
  }

  // 4) タグ整形
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  // 5) DB挿入（RLSチェック回避の一時ポリシー下でも通るよう型を厳密に）
  const payload: {
    user_id: string;
    title: string;
    body: string;
    tags: string[] | null;
    image_urls: string[];
  } = {
    user_id: user.id,
    title: titleRaw.trim() || "Untitled",
    body: bodyRaw ?? "",
    tags: tags.length ? tags : null,
    image_urls: imageUrls,
  };

  // undefined 除去（安全策）
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );

  const { error: insErr } = await supabase
    .from("posts")
    .insert([clean])
    .select()
    .single();

  if (insErr) {
    const msg =
      "Insert failed: " +
      (insErr.message || "") +
      "; payload=" +
      JSON.stringify(clean) +
      "; user=" +
      user.id;
    return { ok: false, error: msg };
  }

  return { ok: true, error: null };
}
