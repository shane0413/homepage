'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft, LuTag } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { PostListItem } from '@/components/PostCard';
import { usePosts } from '@/lib/use-posts';

export default function TagDetailPage() {
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(params.tag);
  const { posts, loading } = usePosts();

  const filtered = useMemo(
    () =>
      posts.filter((p) =>
        (p.tags || '').split(',').map((t) => t.trim()).includes(tag)
      ),
    [posts, tag]
  );

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href="/blog/tags"
          className="mb-6 flex items-center gap-1.5 text-sm text-(--color-accent) hover:underline"
        >
          <LuArrowLeft className="h-4 w-4" />
          所有标签
        </Link>

        <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold">
          <LuTag className="h-6 w-6 text-(--color-fg-muted)" />
          #{tag}
        </h1>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-(--color-fg-muted)">该标签下暂无文章</div>
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
