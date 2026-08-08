'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuLayoutGrid, LuList } from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';
import { PostGridCard, PostListItem } from '@/components/PostCard';
import { groupPostsByMonth, getEffectiveDate } from '@/lib/format-date';
import type { Post } from '@/lib/types';

type ViewMode = 'grid' | 'list';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('grid');

  useEffect(() => {
    const stored = localStorage.getItem('blog-view');
    if (stored === 'grid' || stored === 'list') {
      setView(stored);
    }

    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    localStorage.setItem('blog-view', mode);
  };

  // 按"有效日期"（有修改日期用修改日期，否则用发布日期）分月分栏。
  const monthGroups = useMemo(
    () => groupPostsByMonth(posts, (p) => getEffectiveDate(p.pubDatetime, p.modifiedDatetime)),
    [posts]
  );

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Blog</h1>

          <div className="flex items-center rounded-md border border-(--color-border) p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="网格模式"
              title="网格模式"
              className={`flex h-7 w-7 items-center justify-center rounded ${
                view === 'grid'
                  ? 'bg-(--color-canvas-subtle) text-(--color-fg)'
                  : 'text-(--color-fg-muted)'
              }`}
            >
              <LuLayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="列表模式"
              title="列表模式"
              className={`flex h-7 w-7 items-center justify-center rounded ${
                view === 'list'
                  ? 'bg-(--color-canvas-subtle) text-(--color-fg)'
                  : 'text-(--color-fg-muted)'
              }`}
            >
              <LuList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-(--color-fg-muted)">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="text-(--color-fg-muted)">暂无文章</div>
        ) : (
          <div className="space-y-10">
            {monthGroups.map((group) => (
              <section key={group.key}>
                <h2 className="mb-4 border-b border-(--color-border) pb-2 text-sm font-semibold uppercase tracking-wide text-(--color-fg-subtle)">
                  {group.label}
                </h2>

                {view === 'grid' ? (
                  <div className="grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 sm:grid-cols-2">
                    {group.items.map((post) => (
                      <PostGridCard key={post.id} post={post} totalCount={posts.length} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {group.items.map((post) => (
                      <PostListItem key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
