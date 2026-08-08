'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { usePosts } from '@/lib/use-posts';
import { groupPostsByMonth, getEffectiveDate, formatDate } from '@/lib/format-date';

export default function ArchivePage() {
  const { posts, loading } = usePosts();

  const monthGroups = useMemo(
    () => groupPostsByMonth(posts, (p) => getEffectiveDate(p.pubDatetime, p.modifiedDatetime)),
    [posts]
  );

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold">归档</h1>
        <p className="mb-8 text-sm text-(--color-fg-muted)">共 {posts.length} 篇文章</p>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : monthGroups.length === 0 ? (
          <div className="text-(--color-fg-muted)">暂无文章</div>
        ) : (
          <div className="space-y-8">
            {monthGroups.map((group) => (
              <section key={group.key}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-fg-subtle)">
                  {group.label}
                  <span className="ml-2 font-normal normal-case text-(--color-fg-subtle)">
                    ({group.items.length})
                  </span>
                </h2>
                <ul className="border-l border-(--color-border) pl-4">
                  {group.items.map((post) => (
                    <li key={post.id} className="mb-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="flex flex-wrap items-baseline gap-3 text-sm hover:text-(--color-accent)"
                      >
                        <span className="text-(--color-fg-subtle)">
                          {formatDate(getEffectiveDate(post.pubDatetime, post.modifiedDatetime))}
                        </span>
                        <span className="font-medium text-(--color-fg)">{post.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
