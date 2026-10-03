import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { extractFirstImage } from "@/lib/posts";

export async function GET() {
  const snapshot = await db.collection("posts").get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const post = doc.data();
    if (!post.cover) {
      const cover = extractFirstImage(post.content);
      if (cover) {
        await doc.ref.update({ cover });
        updated++;
      }
    }
  }
  return NextResponse.json({ ok: true, updated });
}
