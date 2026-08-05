'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuCalendar, LuLayoutGrid, LuEye } from 'react-icons/lu';
import { formatDate } from '@/lib/format-date';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  pubDatetime: string;
  views: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>

        {loading ? (
          <div className="text-gray-400">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="text-gray-400">暂无文章</div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <div className="border border-gray-700 rounded-lg p-6 hover:border-gray-600 hover:bg-gray-900 transition cursor-pointer">
                  <h2 className="text-2xl font-bold text-green-400 mb-2 hover:underline">
                    {post.title}
                  </h2>
                  <p className="text-gray-300 mb-3">{post.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <LuCalendar className="w-4 h-4" />
                      {formatDate(post.pubDatetime)}
                    </span>
                    {post.category && (
                      <span className="flex items-center gap-1">
                        <LuLayoutGrid className="w-4 h-4" />
                        {post.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <LuEye className="w-4 h-4" />
                      {post.views} views
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
