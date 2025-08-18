"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type CreatePostResult = 
  | { ok: true; postId: string; warning?: string }
  | { ok: false; error: string };

export async function createPostAction(formData: FormData): Promise<CreatePostResult> {
  console.log('[createPostAction] Request received');
  
  const supabase = createServerClient();

  // 1) 認証確認
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    console.log('[createPostAction] Authentication failed:', userErr?.message);
    return { ok: false, error: `Not authenticated: ${userErr?.message ?? ""}` };
  }
  
  console.log('[createPostAction] User authenticated:', user.id);

  // 2) 入力取得
  const titleRaw = (formData.get("title") as string | null) ?? "";
  const bodyRaw = (formData.get("body") as string | null) ?? "";
  const tagsRaw = (formData.get("tags") as string | null) ?? "";
  const files = formData.getAll("images") as File[];

  console.log('[createPostAction] Form data:', {
    title: titleRaw,
    bodyLength: bodyRaw.length,
    tags: tagsRaw,
    filesCount: files.length
  });

  if (!files.length) {
    console.log('[createPostAction] No images provided');
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
      console.log('[createPostAction] Image upload failed:', upErr.message);
      return { ok: false, error: `Upload failed: ${upErr.message}` };
    }

    const { data } = supabase.storage.from("posts").getPublicUrl(path);
    imageUrls.push(data.publicUrl);
    console.log('[createPostAction] Image uploaded:', path);
  }

  if (!Array.isArray(imageUrls) || imageUrls.length < 1) {
    return { ok: false, error: "No imageUrls after upload" };
  }
  if (imageUrls.length > 1) {
    return { ok: false, error: "Only 1 image is allowed" };
  }

  // 4) タグ整形
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  // 5) DB挿入（RLSチェック回避の一時ポリシー下でも通るよう型を厳密に）
  const payload = {
    user_id: user.id,
    title: titleRaw.trim() || "Untitled",
    body: bodyRaw ?? "",
    tags: tags.length ? tags : [],
    image_urls: imageUrls,
  };

  console.log('[createPostAction] Attempting to insert post:', {
    ...payload,
    image_urls_count: payload.image_urls.length
  });

  const { data: newPost, error: insErr } = await supabase
    .from("posts")
    .insert(payload)
    .select()
    .single();

  if (insErr) {
    console.log('[createPostAction] Initial insert failed:', insErr.message);
    // If standard insert fails due to schema cache, try a different approach
    if (insErr.message?.includes("schema cache") || insErr.message?.includes("image_urls")) {
      // Try inserting without the type annotation and ensure arrays are properly formatted
      const { data: retryPost, error: retryErr } = await supabase
        .from("posts")
        .insert([{
          user_id: user.id,
          title: titleRaw.trim() || "Untitled",
          body: bodyRaw ?? "",
          tags: tags.length ? tags : [],
          image_urls: imageUrls
        }])
        .select()
        .single();

      if (retryErr) {
        // As a last resort, try without image_urls to ensure posts can be created
        const { data: fallbackPost, error: fallbackErr } = await supabase
          .from("posts")
          .insert([{
            user_id: user.id,
            title: titleRaw.trim() || "Untitled",
            body: bodyRaw ?? "",
            tags: tags.length ? tags : []
            // Temporarily omit image_urls field
          }])
          .select()
          .single();

        if (fallbackErr) {
          const msg =
            "Insert failed after all attempts: " +
            (fallbackErr.message || "") +
            "; original error: " +
            (insErr.message || "") +
            "; payload=" +
            JSON.stringify(payload) +
            "; user=" +
            user.id;
          return { ok: false, error: msg };
        }
        
        // Post created without image_urls - notify user
        console.log('[createPostAction] Post created without images:', fallbackPost.id);
        return { 
          ok: true, 
          postId: fallbackPost.id,
          warning: "Post created successfully, but images could not be saved due to a temporary issue."
        };
      }
      
      console.log('[createPostAction] Post created on retry:', retryPost.id);
      return { ok: true, postId: retryPost.id };
    } else {
      const msg =
        "Insert failed: " +
        (insErr.message || "") +
        "; payload=" +
        JSON.stringify(payload) +
        "; user=" +
        user.id;
      return { ok: false, error: msg };
    }
  }

  // Revalidate paths to ensure fresh data
  console.log('[createPostAction] Post created successfully:', newPost.id);
  console.log('[createPostAction] Revalidating paths...');
  
  revalidatePath('/');
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/me', 'page');
  revalidatePath(`/en`);
  revalidatePath(`/en/me`);
  revalidatePath(`/ja`);
  revalidatePath(`/ja/me`);

  console.log('[createPostAction] Success response:', { postId: newPost.id });
  return { ok: true, postId: newPost.id };
}
