'use client';

import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isAuth, setIsAuth] = useState(false);
    const [fileName, setFileName] = useState('');

    const defaultContent = `---
author: Shane
pubDatetime: ${new Date().toISOString()}
title: 
featured: false
draft: true
tags:
- 
category: 
description: 
---
# 开始写文章`;

    const [content, setContent] = useState(defaultContent);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
            setIsAuth(true);
            setPassword('');
        } else {
            showToast('error', '密码错误');
        }
    };

    const parseFrontmatter = (text: string) => {
        const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (!match) return null;

        const frontmatter = match[1];
        const body = match[2];

        const data: any = {};
        const lines = frontmatter.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('title:')) {
                data.title = line.replace('title:', '').trim();
            }

            else if (line.startsWith('author:')) {
                data.author = line.replace('author:', '').trim();
            }

            else if (line.startsWith('pubDatetime:')) {
                data.pubDatetime = line.replace('pubDatetime:', '').trim();
            }

            else if (line.startsWith('featured:')) {
                data.featured = line.includes('true');
            }

            else if (line.startsWith('draft:')) {
                data.draft = line.includes('true');
            }

            else if (line.startsWith('category:')) {
                data.category = line.replace('category:', '').trim();
            }

            else if (line.startsWith('description:')) {
                data.description = line.replace('description:', '').trim();
            }

            else if (line.startsWith('tags:')) {
                const tags: string[] = [];

                let index = i + 1;

                while (
                    index < lines.length &&
                    lines[index].trim().startsWith('-')
                ) {
                    const tag = lines[index]
                        .replace('-', '')
                        .trim();

                    if (tag) {
                        tags.push(tag);
                    }

                    index++;
                }

                data.tags = tags.join(',');
            }
        }

        return {
            frontmatter: data,
            body,
        };
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fileName) {
            showToast('error', '请输入文件名');
            return;
        }

        setLoading(true);

        try {
            const parsed = parseFrontmatter(content);

            if (!parsed) {
                showToast('error', 'Frontmatter格式错误');
                setLoading(false);
                return;
            }

            const slug = fileName
                .replace('.mdx', '')
                .toLowerCase();


            const pubDatetime =
                parsed.frontmatter.pubDatetime &&
                !isNaN(Date.parse(parsed.frontmatter.pubDatetime))
                    ? new Date(parsed.frontmatter.pubDatetime)
                    : new Date();


            const res = await fetch('/api/posts/create', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({
                    title: parsed.frontmatter.title || '',
                    slug,

                    excerpt:
                        parsed.frontmatter.description || '',

                    content: parsed.body,

                    author:
                        parsed.frontmatter.author || 'Shane',

                    category:
                        parsed.frontmatter.category || '',

                    featured:
                        parsed.frontmatter.featured || false,

                    draft:
                        parsed.frontmatter.draft !== false,

                    tags:
                        parsed.frontmatter.tags || '',

                    pubDatetime,
                }),
            });


            if (res.ok) {
                showToast('success', '文章发布成功');
                setFileName('');
                setContent(defaultContent);

            } else {
                const error = await res.json();

                showToast(
                    'error',
                    error.error || '发布失败'
                );
            }


        } catch (err) {
            showToast(
                'error',
                '错误：' + String(err)
            );

        } finally {
            setLoading(false);
        }
    };


    if (!isAuth) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-8">
                <form
                    onSubmit={handleLogin}
                    className="bg-gray-900 border border-gray-700 rounded p-8 max-w-sm w-full"
                >
                    <h1 className="text-2xl font-bold mb-6">
                        Admin
                    </h1>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="输入管理密码"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-green-400 outline-none mb-4"
                        autoFocus
                    />

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                    >
                        登录
                    </button>

                </form>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

            {toast && (
                <div
                    className={`fixed top-4 right-4 px-6 py-3 rounded shadow-lg text-white transition z-50 ${
                        toast.type === 'success'
                            ? 'bg-green-600'
                            : 'bg-red-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="border-b border-gray-700 bg-gray-900 px-6 py-3 flex justify-between items-center">

                <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 text-sm">
                        shane-blog / posts /
                    </span>

                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="bg-transparent text-white outline-none text-sm focus:bg-gray-800 focus:px-2 focus:py-1 focus:rounded border border-transparent focus:border-green-400 transition"
                        placeholder="filename.mdx"
                    />
                </div>


                <div className="flex gap-3 items-center">

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-1 px-4 rounded text-sm"
                    >
                        {loading ? '保存中...' : 'Commit'}
                    </button>


                    <button
                        onClick={() => setIsAuth(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                        登出
                    </button>

                </div>

            </div>


            <div className="flex-1 overflow-hidden bg-gray-900">

                <CodeMirror
                    value={content}
                    onChange={(val) => setContent(val)}
                    extensions={[markdown()]}
                    theme="dark"
                    className="h-full"

                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        foldGutter: true,
                    }}

                    style={{
                        height: '100%',
                        fontSize: '14px',
                    }}
                />

            </div>

        </div>
    );
}