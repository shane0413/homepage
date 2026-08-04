'use client';

import { useEffect, useState } from 'react';

const config = {
  name: "Shane",
  title: "Tech Blogger & Android Enthusiast",
  bio: "搞机圈的人｜Astro 爱好者｜分享 Android 改机、应用对比、技术教程",
  email: "shane@example.com",
  links: [
    { label: "Blog", url: "https://shane-blog.pages.dev" },
    { label: "Docs", url: "https://shane-docs.pages.dev" },
    { label: "GitHub", url: "https://github.com/shane0413" },
    { label: "Telegram", url: "https://t.me/Shane_0413" }
  ],
};

interface Repo {
  id: number;
  name: string;
  description: string;
  language: string;
  stargazers_count: number;
  html_url: string;
}

interface User {
  avatar_url: string;
  name: string;
}

export default function Home() {
  const [tab, setTab] = useState('overview');
  const [projects, setProjects] = useState<Repo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取用户信息
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error(err));

    // 获取项目
    fetch('/api/repos')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalStars = projects.reduce((sum, proj) => sum + proj.stargazers_count, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* 导航栏 */}
      <nav className="border-b border-gray-700 sticky top-0 bg-gray-950 bg-opacity-95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-white">@{config.name.toLowerCase()}</div>
          <ul className="flex gap-8">
            {config.links.map((link) => (
              <li key={link.label}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-green-400 transition">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 头部信息 */}
        <div className="mb-12">
          <div className="flex items-start gap-8 mb-8">
            {/* 头像区域 */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-white font-bold">S</span>
              )}
            </div>
            
            {/* 个人信息 */}
            <div className="flex-1 pt-2">
              <h1 className="text-3xl font-bold text-white mb-2">{config.name}</h1>
              <p className="text-lg text-gray-300 mb-3">{config.title}</p>
              <p className="text-gray-400 mb-4 leading-relaxed">{config.bio}</p>
              <a 
                href="https://shane-blog.pages.dev/about"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition inline-block"
              >
                About
              </a>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-white font-bold">{projects.length}</span>
              <span className="text-gray-400"> projects</span>
            </div>
            <div>
              <span className="text-white font-bold">{totalStars}</span>
              <span className="text-gray-400"> stars</span>
            </div>
            <div>
              <span className="text-white font-bold">搞机圈</span>
              <span className="text-gray-400"> member</span>
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="border-b border-gray-700 mb-8 flex gap-6">
          {['overview', 'projects', 'contributions'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 px-1 border-b-2 transition capitalize ${
                tab === t
                  ? 'border-green-400 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 项目卡片 */}
        {tab === 'overview' || tab === 'projects' ? (
          <div className="grid gap-4">
            {loading ? (
              <div className="text-gray-400 text-center py-8">加载中...</div>
            ) : projects.length === 0 ? (
              <div className="text-gray-400 text-center py-8">暂无项目</div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-900 transition">
                  <div className="flex items-start justify-between mb-2">
                    <a 
                      href={project.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:underline font-semibold text-lg"
                    >
                      {project.name}
                    </a>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      ⭐ {project.stargazers_count}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{project.description || "No description"}</p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{project.language || "Unknown"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            contributions chart coming soon...
          </div>
        )}
      </main>
    </div>
  );
}