'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LuFolder } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { usePosts } from '@/lib/use-posts';
import { getEffectiveDate, formatDate } from '@/lib/format-date';

export default function TimelinePage() {
  const { posts, loading } = usePosts();

  const sorted = useMemo(
    () =>
      [...posts].sort(
        (a, b) =>
          getEffectiveDate(b.pubDatetime, b.modifiedDatetime).getTime() -
          getEffectiveDate(a.pubDatetime, a.modifiedDatetime).getTime()
      ),
    [posts]
  );

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold">时间轴</h1>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : sorted.length === 0 ? (
          <div className="text-(--color-fg-muted)">暂无文章</div>
        ) : (
          <ol className="relative border-l border-(--color-border) pl-6">
            {sorted.map((post) => (
              <li key={post.id} className="mb-8 last:mb-0">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-(--color-canvas) bg-(--color-accent)" />
                <time className="mb-1 block text-xs text-(--color-fg-subtle)">
                  {formatDate(getEffectiveDate(post.pubDatetime, post.modifiedDatetime))}
                </time>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-lg font-semibold hover:text-(--color-accent)"
                >
                  {post.title}
                </Link>
                {post.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-(--color-fg-muted)">
                    {post.excerpt}
                  </p>
                )}
                {post.category && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-(--color-fg-subtle)">
                    <LuFolder className="h-3 w-3" />
                    {post.category}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
