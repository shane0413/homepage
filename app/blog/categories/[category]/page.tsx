'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft, LuFolder } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { PostListItem } from '@/components/PostCard';
import { usePosts } from '@/lib/use-posts';

export default function CategoryDetailPage() {
  const params = useParams<{ category: string }>();
  const category = decodeURIComponent(params.category);
  const { posts, loading } = usePosts();

  const filtered = useMemo(
    () => posts.filter((p) => p.category === category),
    [posts, category]
  );

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href="/blog/categories"
          className="mb-6 flex items-center gap-1.5 text-sm text-(--color-accent) hover:underline"
        >
          <LuArrowLeft className="h-4 w-4" />
          所有分类
        </Link>

        <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold">
          <LuFolder className="h-6 w-6 text-(--color-fg-muted)" />
          {category}
        </h1>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-(--color-fg-muted)">该分类下暂无文章</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
