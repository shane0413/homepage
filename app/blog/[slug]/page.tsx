import { MDXRemote } from 'next-mdx-remote/rsc';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function getPost(slug: string) {
  try {
    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    return result[0] || null;
  } catch (err) {
    console.error('GET POST (page) ERROR:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post?.title || 'Post',
    description: post?.excerpt || '',
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-gray-400">文章未找到</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <a href="/blog" className="text-green-400 hover:underline mb-8 block">
          ← 返回博客
        </a>

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex gap-4 text-sm text-gray-400 mb-8">
          <span>{post.views} views</span>
          <span>
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString()
              : ''}
          </span>
        </div>

        <article className="prose prose-invert max-w-none">
          <MDXRemote source={post.content} />
        </article>
      </div>
    </div>
  );
}