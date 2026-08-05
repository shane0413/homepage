import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 检查 slug 是否已经存在
    const existingPost = await db.query.posts.findFirst({
      where: eq(posts.slug, data.slug),
    });

    if (existingPost) {
      return Response.json(
        {
          error: 'slug 已存在，请修改文件名',
        },
        {
          status: 400,
        }
      );
    }

    const newPost = await db
      .insert(posts)
      .values({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content || '',
        author: data.author || 'Shane',
        category: data.category || '',
        featured: data.featured || false,
        draft: data.draft !== false,
        tags: data.tags || '',
        pubDatetime: data.pubDatetime
          ? new Date(data.pubDatetime)
          : new Date(),
      })
      .returning();

    return Response.json(newPost[0], {
      status: 201,
    });

  } catch (error: any) {
    console.error('CREATE POST ERROR:', error);

    return Response.json(
      {
        error: error.message || '创建文章失败',
      },
      {
        status: 500,
      }
    );
  }
}