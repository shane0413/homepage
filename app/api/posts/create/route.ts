import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();

    if (!data.slug) {
      return Response.json({ error: '缺少 slug' }, { status: 400 });
    }

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
        // 新建文章默认视为"未修改过"，除非调用方显式传入了 modifiedDatetime。
        modifiedDatetime: data.modifiedDatetime
          ? new Date(data.modifiedDatetime)
          : null,
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
