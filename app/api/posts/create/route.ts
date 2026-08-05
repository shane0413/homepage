import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const oldPost = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, data.slug))
      .limit(1);

    if (oldPost.length > 0) {
      return Response.json(
        {
          error: `slug "${data.slug}" 已存在`,
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();

    const newPost = await db
      .insert(posts)
      .values({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content || '',
        author: data.author || 'Shane',
        category: data.category || '',
        featured: data.featured ?? false,
        draft: data.draft ?? false,
        tags: data.tags || '',
        pubDatetime: data.pubDatetime
          ? new Date(data.pubDatetime)
          : now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return Response.json(newPost[0], {
      status: 201,
    });

  } catch (error: any) {
    console.error('CREATE POST ERROR:', error);
    if (error?.cause) {
      console.error('CREATE POST ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        error:
          error?.cause?.message ||
          error?.message ||
          '创建文章失败',
        code: error?.code || error?.cause?.code || null,
      },
      {
        status: 500,
      }
    );
  }
}