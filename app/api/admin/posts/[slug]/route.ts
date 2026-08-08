import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/admin-auth';

// 管理后台读取单篇文章（含草稿），供编辑器回填内容使用。需要管理员密码。
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

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
    console.error('ADMIN GET POST ERROR:', error);
    if (error?.cause) {
      console.error('ADMIN GET POST ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        error:
          error?.cause?.message || error?.message || 'Failed to fetch post',
        code: error?.code || error?.cause?.code || null,
      },
      { status: 500 }
    );
  }
}

// 更新文章（admin 编辑器"保存修改"时调用）。需要管理员密码。
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const { slug } = await params;
    const data = await request.json();

    const existing = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const nextSlug = data.slug ? String(data.slug) : slug;

    if (nextSlug !== slug) {
      const clash = await db
        .select()
        .from(posts)
        .where(and(eq(posts.slug, nextSlug), ne(posts.id, existing[0].id)))
        .limit(1);

      if (clash.length > 0) {
        return Response.json(
          { error: `slug "${nextSlug}" 已存在` },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    const updated = await db
      .update(posts)
      .set({
        title: data.title,
        slug: nextSlug,
        excerpt: data.excerpt || '',
        content: data.content || '',
        coverImage: data.coverImage || null,
        author: data.author || 'Shane',
        category: data.category || '',
        featured: data.featured ?? false,
        draft: data.draft ?? false,
        tags: data.tags || '',
        pubDatetime: data.pubDatetime
          ? new Date(data.pubDatetime)
          : existing[0].pubDatetime,
        // 留空/删掉该字段则视为"未修改过"；由前端根据是否自动填入台北时间来决定。
        modifiedDatetime: data.modifiedDatetime
          ? new Date(data.modifiedDatetime)
          : null,
        updatedAt: now,
      })
      .where(eq(posts.slug, slug))
      .returning();

    return Response.json(updated[0]);
  } catch (error: any) {
    console.error('UPDATE POST ERROR:', error);
    if (error?.cause) {
      console.error('UPDATE POST ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        error: error?.cause?.message || error?.message || '更新文章失败',
        code: error?.code || error?.cause?.code || null,
      },
      { status: 500 }
    );
  }
}

// 删除文章。需要管理员密码。
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const { slug } = await params;

    const deleted = await db
      .delete(posts)
      .where(eq(posts.slug, slug))
      .returning();

    if (deleted.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE POST ERROR:', error);
    if (error?.cause) {
      console.error('DELETE POST ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        error: error?.cause?.message || error?.message || '删除文章失败',
        code: error?.code || error?.cause?.code || null,
      },
      { status: 500 }
    );
  }
}
