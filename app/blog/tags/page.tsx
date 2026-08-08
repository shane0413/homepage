'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { LuTag } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { usePosts } from '@/lib/use-posts';

export default function TagsPage() {
  const { posts, loading } = usePosts();

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      const list = (post.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      for (const tag of list) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold">标签</h1>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : tags.length === 0 ? (
          <div className="text-(--color-fg-muted)">暂无标签</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/blog/tags/${encodeURIComponent(tag)}`}
                className="flex items-center gap-1.5 rounded-full border border-(--color-border) px-3 py-1.5 text-sm transition hover:border-(--color-accent)"
              >
                <LuTag className="h-3.5 w-3.5 text-(--color-fg-muted)" />
                {tag}
                <span className="text-(--color-fg-subtle)">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
