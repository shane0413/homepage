import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { LuCalendar, LuPencil, LuFolder, LuTag, LuArrowUp, LuEye, LuArrowLeft } from 'react-icons/lu';
import { formatDate, isModified } from '@/lib/format-date';
import ShareButtons from '@/components/ShareButtons';
import SiteHeader from '@/components/SiteHeader';
import { ikUrl } from '@/lib/imagekit-url'; // 新增导入

async function getPost(slug: string) {
  try {
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.draft, false)))
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
      .select({ slug: posts.slug, title: posts.title })
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
      <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center text-(--color-fg-muted)">
          文章未找到
        </div>
      </div>
    );
  }

  const nextPost = await getNextPost(slug);

  const tags = post.tags
    ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.vercel.app'
    }/blog/${post.slug}`;

  return (
    <div id="top" className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <Link
          href="/blog"
          className="mb-8 flex items-center gap-1.5 text-sm text-(--color-accent) hover:underline"
        >
          <LuArrowLeft className="h-4 w-4" />
          返回博客
        </Link>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ikUrl(post.coverImage)} // 修改此处
            alt={post.title}
            className="mb-6 w-full rounded-lg border border-(--color-border) object-cover"
          />
        )}

        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">{post.title}</h1>

        <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-(--color-fg-muted)">
          <span className="flex items-center gap-1">
            <LuCalendar className="h-4 w-4" />
            {formatDate(post.pubDatetime)}
          </span>
          {isModified(post.modifiedDatetime) && (
            <span className="flex items-center gap-1" title="最后一次修改日期">
              <LuPencil className="h-4 w-4 text-(--color-attention)" />
              {formatDate(post.modifiedDatetime)}
            </span>
          )}
          <span>{post.author}</span>
          <span className="flex items-center gap-1">
            <LuEye className="h-4 w-4" />
            {post.views} views
          </span>
        </div>

        <article className="prose-site">
          <MDXRemote source={post.content} />
        </article>

        <div className="mt-12 space-y-4 border-t border-(--color-border) pt-6">
          {post.category && (
            <div className="flex items-center gap-2 text-sm text-(--color-fg-muted)">
              <span>分类：</span>
              <Link
                href={`/blog/categories/${encodeURIComponent(post.category)}`}
                className="flex items-center gap-1 text-(--color-fg) transition hover:text-(--color-accent)"
              >
                <LuFolder className="h-4 w-4" />
                {post.category}
              </Link>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-(--color-fg-muted)">
              <span className="flex items-center gap-1">
                <LuTag className="h-4 w-4" />
                标签：
              </span>
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tags/${encodeURIComponent(tag)}`}
                  className="text-(--color-fg) transition hover:text-(--color-accent)"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="mb-2 text-sm text-(--color-fg-muted)">分享此文章：</div>
              <ShareButtons url={pageUrl} title={post.title} />
            </div>

            <a
              href="#top"
              className="flex items-center gap-1 text-sm text-(--color-fg-muted) transition hover:text-(--color-accent)"
            >
              <LuArrowUp className="h-4 w-4" />
              返回顶部
            </a>
          </div>
        </div>

        {nextPost && (
          <div className="mt-10 border-t border-(--color-border) pt-6 text-right">
            <div className="mb-1 text-sm text-(--color-fg-muted)">下一篇</div>
            <Link
              href={`/blog/${nextPost.slug}`}
              className="font-semibold text-(--color-accent) hover:underline"
            >
              {nextPost.title} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}