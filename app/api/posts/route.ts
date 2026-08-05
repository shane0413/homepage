import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';

export async function GET() {
  try {
    const allPosts = await db.select().from(posts).orderBy(posts.createdAt);
    return Response.json(allPosts);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}