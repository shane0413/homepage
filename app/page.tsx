'use client';

import { useEffect, useState } from 'react';
import {
  LuStar,
  LuGitFork,
  LuExternalLink,
  LuGithub,
  LuUserPlus,
} from 'react-icons/lu';
import SiteHeader from '@/components/SiteHeader';

const config = {
  name: 'Shane',
  title: 'Tech Blogger & Android Enthusiast',
  bio: '谢恩的个人站点 · 基于 Next.js 和 React 构建，TypeScript 加持',
  links: [
    { label: 'Blog', url: '/blog' },
    { label: 'Docs', url: 'https://shane-docs.pages.dev' },
    { label: 'Telegram', url: 'https://t.me/Shane_0413' },
  ],
};

interface Repo {
  id: number;
  name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
}

export default function Home() {
  const [tab, setTab] = useState<'overview' | 'projects'>('overview');
  const [projects, setProjects] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reposRes = await fetch('/api/repos');
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          setProjects(Array.isArray(reposData) ? reposData : []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalStars = projects.reduce((sum, p) => sum + (p.stargazers_count || 0), 0);
  const visibleProjects = tab === 'projects' ? projects : projects.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-(--color-canvas) text-(--color-fg)">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[280px_1fr]">
          {/* 左侧个人信息栏，参照 GitHub 个人主页布局 */}
          <aside className="flex flex-col items-start gap-4">
            <div className="h-52 w-52 overflow-hidden rounded-full border border-(--color-border)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shane_avaver.png"
                alt={config.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-(--color-fg)">{config.name}</h1>
              <p className="text-lg text-(--color-fg-muted)">{config.title}</p>
            </div>

            <p className="leading-relaxed text-(--color-fg)">{config.bio}</p>

            <a
              href="https://github.com/shane0413"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-(--color-border) bg-(--color-canvas-subtle) px-4 py-1.5 text-sm font-medium text-(--color-fg) transition hover:border-(--color-accent) hover:text-(--color-accent)"
            >
              <LuUserPlus className="h-4 w-4" />
              Follow me
            </a>

            <div className="flex items-center gap-2 text-sm text-(--color-fg-muted)">
              <LuGithub className="h-4 w-4" />
              <a
                href="https://github.com/shane0413"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent) hover:underline"
              >
                shane0413
              </a>
            </div>

            <ul className="flex flex-col gap-2 pt-2 text-sm">
              {config.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target={link.url.startsWith('http') ? '_blank' : undefined}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-1.5 text-(--color-fg-muted) transition hover:text-(--color-accent)"
                  >
                    {link.label}
                    {link.url.startsWith('http') && <LuExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex gap-6 border-t border-(--color-border) pt-4 text-sm">
              <div>
                <span className="font-semibold text-(--color-fg)">{projects.length}</span>
                <span className="text-(--color-fg-muted)"> projects</span>
              </div>
              <div>
                <span className="font-semibold text-(--color-fg)">{totalStars}</span>
                <span className="text-(--color-fg-muted)"> stars</span>
              </div>
            </div>
          </aside>

          {/* 右侧内容区 */}
          <section>
            <div className="mb-6 flex gap-6 border-b border-(--color-border)">
              {(['overview', 'projects'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-1 pb-3 text-sm capitalize transition ${
                    tab === t
                      ? 'border-(--color-accent) font-medium text-(--color-fg)'
                      : 'border-transparent text-(--color-fg-muted) hover:text-(--color-fg)'
                  }`}
                >
                  {t === 'overview' ? 'Overview' : 'Projects'}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {loading ? (
                <div className="py-8 text-center text-(--color-fg-muted)">加载中...</div>
              ) : visibleProjects.length === 0 ? (
                <div className="py-8 text-center text-(--color-fg-muted)">暂无项目</div>
              ) : (
                visibleProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-lg border border-(--color-border) p-4 transition hover:border-(--color-accent)"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <a
                        href={project.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-(--color-accent) hover:underline"
                      >
                        {project.name}
                      </a>
                      <div className="flex flex-shrink-0 items-center gap-3 text-sm text-(--color-fg-muted)">
                        <span className="flex items-center gap-1">
                          <LuStar className="h-4 w-4" />
                          {project.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <LuGitFork className="h-4 w-4" />
                          {project.forks_count}
                        </span>
                      </div>
                    </div>
                    <p className="mb-3 text-(--color-fg-muted)">
                      {project.description || 'No description'}
                    </p>
                    {project.language && (
                      <span className="text-xs text-(--color-fg-subtle)">{project.language}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
