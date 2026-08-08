'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { LuFolder } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { usePosts } from '@/lib/use-posts';

export default function CategoriesPage() {
  const { posts, loading } = usePosts();

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      if (!post.category) continue;
      map.set(post.category, (map.get(post.category) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold">分类</h1>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : categories.length === 0 ? (
          <div className="text-(--color-fg-muted)">暂无分类</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {categories.map(([category, count]) => (
              <Link
                key={category}
                href={`/blog/categories/${encodeURIComponent(category)}`}
                className="flex items-center justify-between rounded-lg border border-(--color-border) px-4 py-3 transition hover:border-(--color-accent)"
              >
                <span className="flex items-center gap-2 font-medium">
                  <LuFolder className="h-4 w-4 text-(--color-fg-muted)" />
                  {category}
                </span>
                <span className="text-sm text-(--color-fg-muted)">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
