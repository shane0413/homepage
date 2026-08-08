import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const tables = await db.all(
      sql`select name from sqlite_master where type='table'`
    );

    const countRow = await db.all(sql`select count(*) as c from posts`);
    const postCount = Array.isArray(countRow) && countRow[0]
      ? (countRow[0] as any).c
      : null;

    const postCount1 = await db.select().from(posts).limit(1);

    // 帮助排查"数据消失"问题：如果 DATABASE_URL 指向本地文件
    // (file:...)，在 Vercel 等无状态部署环境下，每次重新部署都会得到
    // 一个全新的空文件系统，数据自然会"消失"。生产环境必须使用真正的
    // 云端 Turso 数据库地址 (libsql://...)。
    const rawUrl = process.env.DATABASE_URL || '';
    const isLocalFileDb = rawUrl.startsWith('file:');

    return Response.json({
      ok: true,
      tables,
      postCount,
      postsTableReachable: true,
      samplePost: postCount1[0] || null,
      databaseUrlScheme: rawUrl.split(':')[0] || null,
      warning: isLocalFileDb
        ? '当前 DATABASE_URL 指向本地文件数据库，在 Vercel 等无持久化文件系统的环境中，每次重新部署数据都会丢失。请改用 libsql:// 开头的云端 Turso 数据库地址。'
        : null,
    });
  } catch (error: any) {
    console.error('DB CHECK ERROR:', error);
    if (error?.cause) {
      console.error('DB CHECK ERROR CAUSE:', error.cause);
    }

    return Response.json(
      {
        ok: false,
        error: error?.cause?.message || error?.message,
        code: error?.code || error?.cause?.code || null,
      },
      { status: 500 }
    );
  }
}
