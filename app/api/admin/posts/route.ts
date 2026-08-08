import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/admin-auth';

// 管理后台用的文章列表：包含草稿，供 admin 文章管理页使用。
export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.pubDatetime));

    return Response.json(allPosts);
  } catch (error: any) {
    console.error('ADMIN LIST POSTS ERROR:', error);
    if (error?.cause) {
      console.error('ADMIN LIST POSTS ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        error:
          error?.cause?.message ||
          error?.message ||
          'Failed to fetch posts',
        code: error?.code || error?.cause?.code || null,
      },
      { status: 500 }
    );
  }
}
