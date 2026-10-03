import { db } from "../src/lib/firebase";
import { extractFirstImage } from "../src/lib/posts";

async function run() {
  const snapshot = await db.collection("posts").get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const post = doc.data();
    if (!post.cover) {
      const cover = extractFirstImage(post.content);
      if (cover) {
        await doc.ref.update({ cover });
        console.log(`Updated post ${post.slug} with cover ${cover}`);
        updated++;
      }
    }
  }
  console.log(`Done. Updated ${updated} posts.`);
}

run().catch(console.error);
