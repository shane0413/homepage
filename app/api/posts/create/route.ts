import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const newPost = await db.insert(posts).values({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author || 'Shane',
      category: data.category,
      featured: data.featured || false,
      draft: data.draft !== false, // 默认是draft
      tags: data.tags,
      pubDatetime: data.pubDatetime ? new Date(data.pubDatetime) : new Date(),
    }).returning();

    return Response.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }
}