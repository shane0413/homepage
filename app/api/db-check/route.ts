import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const tables = await db.all(
      sql`select name from sqlite_master where type='table'`
    );

    const postCount = await db.select().from(posts).limit(1);

    return Response.json({
      ok: true,
      tables,
      postsTableReachable: true,
      samplePost: postCount[0] || null,
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
