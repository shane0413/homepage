import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LuCalendar, LuLayoutGrid, LuTag, LuArrowUp, LuEye } from 'react-icons/lu';
import { formatDate } from '@/lib/format-date';
import ShareButtons from '@/components/ShareButtons';

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

async function getNextPost(slug: string) {
  try {
    const list = await db
      .select({
        slug: posts.slug,
        title: posts.title,
      })
      .from(posts)
      .where(eq(posts.draft, false))
      .orderBy(desc(posts.pubDatetime));

    const currentIndex = list.findIndex((p) => p.slug === slug);

    if (currentIndex === -1 || currentIndex === list.length - 1) {
      return null;
    }

    return list[currentIndex + 1];
  } catch (err) {
    console.error('GET NEXT POST ERROR:', err);
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

  const nextPost = await getNextPost(slug);

  const tags = post.tags
    ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const pageUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL || 'https://shanepage.netlify.app'
  }/blog/${post.slug}`;

  return (
    <div id="top" className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <a href="/blog" className="text-green-400 hover:underline mb-8 block">
          ← 返回博客
        </a>

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8">
          <span className="flex items-center gap-1">
            <LuCalendar className="w-4 h-4" />
            {formatDate(post.pubDatetime)}
          </span>
          <span>{post.author}</span>
          <span className="flex items-center gap-1">
            <LuEye className="w-4 h-4" />
            {post.views} views
          </span>
        </div>

        <article className="prose prose-invert max-w-none">
          <MDXRemote source={post.content} />
        </article>

        <div className="mt-12 space-y-4 border-t border-gray-700 pt-6">
          {post.category && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>分类：</span>
              <span className="flex items-center gap-1 text-gray-200">
                <LuLayoutGrid className="w-4 h-4" />
                {post.category}
              </span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <LuTag className="w-4 h-4" />
                标签：
              </span>
              {tags.map((tag) => (
                <span key={tag} className="text-gray-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="mb-2 text-sm text-gray-400">分享此文章：</div>
              <ShareButtons url={pageUrl} title={post.title} />
            </div>

            <a
              href="#top"
              className="flex items-center gap-1 text-sm text-gray-400 transition hover:text-green-400"
            >
              <LuArrowUp className="w-4 h-4" />
              返回顶部
            </a>
          </div>
        </div>

        {nextPost && (
          <div className="mt-10 border-t border-gray-700 pt-6 text-right">
            <div className="mb-1 text-sm text-gray-400">下一篇</div>
            <Link
              href={`/blog/${nextPost.slug}`}
              className="font-bold text-green-400 hover:underline"
            >
              {nextPost.title} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
