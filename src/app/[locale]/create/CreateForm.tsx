"use client";

import { useState } from "react";
import { createPostAction } from "./actions";

export default function CreateForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await createPostAction(fd);
      // 追加: 返却オブジェクトをConsoleに出す
      console.log("createPostAction result:", res);

      if (!res.ok) {
        // 追加: エラーメッセージ全文を表示（payload まで含まれる）
        setMessage(res.error || "Failed to create post");
      } else {
        setMessage("Created!");
        form.reset();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>Title</label>
        <input name="title" maxLength={64} />
      </div>
      <div>
        <label>Body</label>
        <input name="body" maxLength={32} />
      </div>
      <div>
        <label>Tags (comma separated)</label>
        <input name="tags" placeholder="tag1, tag2, ..." />
      </div>
      <div>
        <label>Images (1-3)</label>
        <input name="images" type="file" multiple accept="image/*" />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create"}
      </button>
      {message && <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre>}
    </form>
  );
}
