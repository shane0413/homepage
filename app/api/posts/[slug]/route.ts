import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (post.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(post[0]);
  } catch (error: any) {
    console.error('GET POST ERROR:', error);
    if (error?.cause) {
      console.error('GET POST ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        error:
          error?.cause?.message ||
          error?.message ||
          'Failed to fetch post',
        code: error?.code || error?.cause?.code || null,
      },
      { status: 500 }
    );
  }
}