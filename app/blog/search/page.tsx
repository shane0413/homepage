'use client';

import { useMemo, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { PostListItem } from '@/components/PostCard';
import { usePosts } from '@/lib/use-posts';

export default function SearchPage() {
  const { posts, loading } = usePosts();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return posts.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt || '',
        post.category || '',
        post.tags || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [posts, query]);

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">搜索</h1>

        <div className="relative mb-8">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-fg-muted)" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、描述、分类或标签..."
            autoFocus
            className="w-full rounded-md border border-(--color-border) bg-(--color-canvas) py-2 pl-10 pr-4 text-sm text-(--color-fg) outline-none transition focus:border-(--color-accent)"
          />
        </div>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : !query.trim() ? (
          <div className="text-(--color-fg-muted)">输入关键词开始搜索</div>
        ) : results.length === 0 ? (
          <div className="text-(--color-fg-muted)">没有找到相关文章</div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
