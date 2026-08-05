import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, params.slug))
      .limit(1);

    if (post.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(post[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}