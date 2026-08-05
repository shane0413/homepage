import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.draft, false))
      .orderBy(desc(posts.pubDatetime));

    return Response.json(allPosts);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
