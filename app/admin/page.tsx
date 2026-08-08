'use client';

import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import {
    LuGitBranch,
    LuChevronDown,
    LuPencil,
    LuEye,
    LuLogOut,
    LuLoader,
    LuX,
    LuCheck,
    LuAlignLeft,
    LuFileCode,
} from 'react-icons/lu';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isAuth, setIsAuth] = useState(false);
    const [fileName, setFileName] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

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

    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [softWrap, setSoftWrap] = useState(true);
    const [showCommitDialog, setShowCommitDialog] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [commitDescription, setCommitDescription] = useState('');

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);

        try {
            const res = await fetch('/api/admin/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();
            
            if (data.ok) {
                setIsAuth(true);
                setPassword('');
            } else {
                showToast('error', '密码错误');
            }
        } catch (err) {
            showToast('error', '验证失败：' + String(err));
        } finally {
            setLoggingIn(false);
        }
    };

    const parseFrontmatter = (text: string) => {
        const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

        if (!match) return null;

        const frontmatter = match[1];
        const body = match[2];

        const data: any = {};
        const lines = frontmatter.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('title:')) {
                data.title = line.replace('title:', '').trim();
            } else if (line.startsWith('author:')) {
                data.author = line.replace('author:', '').trim();
            } else if (line.startsWith('pubDatetime:')) {
                data.pubDatetime = line.replace('pubDatetime:', '').trim();
            } else if (line.startsWith('featured:')) {
                data.featured = line.includes('true');
            } else if (line.startsWith('draft:')) {
                data.draft = line.includes('true');
            } else if (line.startsWith('category:')) {
                data.category = line.replace('category:', '').trim();
            } else if (line.startsWith('description:')) {
                data.description = line.replace('description:', '').trim();
            } else if (line.startsWith('tags:')) {
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

    const doSubmit = async () => {
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
                        parsed.frontmatter.featured ?? false,

                    draft:
                        parsed.frontmatter.draft ?? false,

                    tags:
                        parsed.frontmatter.tags || '',

                    pubDatetime,
                }),
            });

            if (res.ok) {
                showToast('success', '文章发布成功');

                setFileName('');
                setContent(defaultContent);
                setActiveTab('edit');
                setShowCommitDialog(false);
                setCommitMessage('');
                setCommitDescription('');
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

    const openCommitDialog = () => {
        if (!fileName) {
            showToast('error', '请输入文件名');
            return;
        }

        setCommitMessage(`Create ${fileName.replace('.mdx', '')}.mdx`);
        setCommitDescription('');
        setShowCommitDialog(true);
    };

    const handleCancelChanges = () => {
        if (
            (content !== defaultContent || fileName) &&
            !window.confirm('放弃当前修改？此操作无法撤销。')
        ) {
            return;
        }

        setFileName('');
        setContent(defaultContent);
        setActiveTab('edit');
    };

    // --- lightweight markdown -> React renderer for the Preview tab ---
    const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
        const nodes: React.ReactNode[] = [];
        const pattern =
            /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]*)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/g;

        let lastIndex = 0;
        let m: RegExpExecArray | null;
        let i = 0;

        while ((m = pattern.exec(text))) {
            if (m.index > lastIndex) {
                nodes.push(text.slice(lastIndex, m.index));
            }

            const key = `${keyPrefix}-${i++}`;

            if (m[1]) {
                nodes.push(
                    <img
                        key={key}
                        src={m[3]}
                        alt={m[2]}
                        className="max-w-full rounded-md my-3 border border-[#30363d]"
                    />
                );
            } else if (m[4]) {
                nodes.push(
                    <a
                        key={key}
                        href={m[6]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#58a6ff] hover:underline"
                    >
                        {m[5]}
                    </a>
                );
            } else if (m[7]) {
                nodes.push(
                    <strong key={key} className="font-semibold text-gray-100">
                        {m[8]}
                    </strong>
                );
            } else if (m[9]) {
                nodes.push(
                    <code
                        key={key}
                        className="bg-[#6e768166] px-1.5 py-0.5 rounded text-[13px] font-mono text-[#e6edf3]"
                    >
                        {m[10]}
                    </code>
                );
            } else if (m[11]) {
                nodes.push(
                    <em key={key} className="text-gray-200">
                        {m[12]}
                    </em>
                );
            }

            lastIndex = pattern.lastIndex;
        }

        if (lastIndex < text.length) {
            nodes.push(text.slice(lastIndex));
        }

        return nodes.length ? nodes : [text];
    };

    const renderMarkdown = (md: string): React.ReactNode[] => {
        const lines = md.replace(/\r\n/g, '\n').split('\n');
        const blocks: React.ReactNode[] = [];

        let i = 0;
        let key = 0;

        while (i < lines.length) {
            const line = lines[i];

            // fenced code block
            if (/^```/.test(line.trim())) {
                const codeLines: string[] = [];
                i++;

                while (i < lines.length && !/^```/.test(lines[i].trim())) {
                    codeLines.push(lines[i]);
                    i++;
                }

                i++; // skip closing ```

                blocks.push(
                    <pre
                        key={key++}
                        className="bg-[#161b22] border border-[#30363d] rounded-md p-4 overflow-x-auto text-[13px] font-mono text-[#c9d1d9] my-4"
                    >
                        <code>{codeLines.join('\n')}</code>
                    </pre>
                );

                continue;
            }

            // heading
            const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const sizes: Record<number, string> = {
                    1: 'text-3xl font-bold mt-8 mb-4 pb-2 border-b border-[#21262d]',
                    2: 'text-2xl font-bold mt-8 mb-3 pb-2 border-b border-[#21262d]',
                    3: 'text-xl font-semibold mt-6 mb-3',
                    4: 'text-lg font-semibold mt-5 mb-2',
                    5: 'text-base font-semibold mt-4 mb-2',
                    6: 'text-sm font-semibold mt-4 mb-2 text-gray-400',
                };
                const Tag = `h${level}` as keyof JSX.IntrinsicElements;

                blocks.push(
                    <Tag key={key++} className={`${sizes[level]} text-gray-100`}>
                        {renderInline(headingMatch[2], `h-${key}`)}
                    </Tag>
                );
                i++;
                continue;
            }

            // horizontal rule
            if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
                blocks.push(<hr key={key++} className="border-[#30363d] my-6" />);
                i++;
                continue;
            }

            // blockquote
            if (line.trim().startsWith('>')) {
                const quoteLines: string[] = [];

                while (i < lines.length && lines[i].trim().startsWith('>')) {
                    quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
                    i++;
                }

                blocks.push(
                    <blockquote
                        key={key++}
                        className="border-l-4 border-[#30363d] pl-4 text-gray-400 italic my-4"
                    >
                        {quoteLines.join(' ')}
                    </blockquote>
                );
                continue;
            }

            // unordered list
            if (/^[-*]\s+/.test(line.trim())) {
                const items: string[] = [];

                while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
                    items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
                    i++;
                }

                blocks.push(
                    <ul key={key++} className="list-disc pl-6 space-y-1 my-4 text-gray-300">
                        {items.map((it, idx) => (
                            <li key={idx}>{renderInline(it, `ul-${key}-${idx}`)}</li>
                        ))}
                    </ul>
                );
                continue;
            }

            // ordered list
            if (/^\d+\.\s+/.test(line.trim())) {
                const items: string[] = [];

                while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                    items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
                    i++;
                }

                blocks.push(
                    <ol key={key++} className="list-decimal pl-6 space-y-1 my-4 text-gray-300">
                        {items.map((it, idx) => (
                            <li key={idx}>{renderInline(it, `ol-${key}-${idx}`)}</li>
                        ))}
                    </ol>
                );
                continue;
            }

            // blank line
            if (line.trim() === '') {
                i++;
                continue;
            }

            // paragraph
            const paraLines: string[] = [];

            while (
                i < lines.length &&
                lines[i].trim() !== '' &&
                !/^```/.test(lines[i].trim()) &&
                !/^#{1,6}\s+/.test(lines[i]) &&
                !/^[-*]\s+/.test(lines[i].trim()) &&
                !/^\d+\.\s+/.test(lines[i].trim()) &&
                !lines[i].trim().startsWith('>') &&
                !/^(-{3,}|\*{3,})$/.test(lines[i].trim())
            ) {
                paraLines.push(lines[i]);
                i++;
            }

            blocks.push(
                <p key={key++} className="text-gray-300 leading-7 my-4">
                    {renderInline(paraLines.join(' '), `p-${key}`)}
                </p>
            );
        }

        return blocks;
    };

    const parsedPreview = useMemo(() => parseFrontmatter(content), [content]);

    if (!isAuth) {
        return (
            <div className="min-h-screen bg-[#0d1117] text-gray-100 flex items-center justify-center p-8">
                {toast && (
                    <div
                        className={`fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg text-white transition z-50 ${
                            toast.type === 'success' ? 'bg-[#238636]' : 'bg-[#da3633]'
                        }`}
                    >
                        {toast.message}
                    </div>
                )}

                <form
                    onSubmit={handleLogin}
                    className="bg-[#161b22] border border-[#30363d] rounded-md p-8 max-w-sm w-full"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <LuGitBranch className="w-5 h-5 text-gray-400" />
                        <h1 className="text-2xl font-bold">Admin</h1>
                    </div>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="输入管理密码"
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-4 py-2 text-white focus:border-[#58a6ff] outline-none mb-4"
                        autoFocus
                        disabled={loggingIn}
                    />

                    <button
                        type="submit"
                        disabled={loggingIn}
                        className="w-full bg-[#238636] hover:bg-[#2ea043] disabled:bg-gray-600 text-white font-semibold py-2 rounded-md transition"
                    >
                        {loggingIn ? '验证中...' : '登录'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-100 flex flex-col">
            <style jsx global>{`
                .admin-editor .cm-editor {
                    background: #0d1117 !important;
                    height: 100%;
                }
                .admin-editor .cm-scroller {
                    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
                        monospace !important;
                }
                .admin-editor .cm-gutters {
                    background: #0d1117 !important;
                    border-right: 1px solid #21262d !important;
                    color: #6e7681 !important;
                }
                .admin-editor .cm-activeLineGutter {
                    background: #161b22 !important;
                    color: #c9d1d9 !important;
                }
                .admin-editor .cm-activeLine {
                    background: #161b2280 !important;
                }
                .admin-editor .cm-selectionBackground,
                .admin-editor ::selection {
                    background: #264f7899 !important;
                }
                .admin-editor .cm-cursor {
                    border-left-color: #58a6ff !important;
                }
                .admin-editor .cm-content {
                    caret-color: #58a6ff;
                }
                .admin-editor.soft-wrap .cm-content,
                .admin-editor.soft-wrap .cm-line {
                    white-space: pre-wrap !important;
                    word-break: break-word !important;
                }
                .admin-editor:not(.soft-wrap) .cm-content,
                .admin-editor:not(.soft-wrap) .cm-line {
                    white-space: pre !important;
                }
            `}</style>

            {toast && (
                <div
                    className={`fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg text-white transition z-50 ${
                        toast.type === 'success' ? 'bg-[#238636]' : 'bg-[#da3633]'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Repo-style top bar */}
            <div className="border-b border-[#21262d] bg-[#0d1117] px-4 sm:px-6 py-3 flex flex-wrap gap-3 justify-between items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
                    <LuFileCode className="w-4 h-4 text-[#58a6ff] shrink-0" />

                    <span className="text-[#58a6ff] whitespace-nowrap">shane-blog</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-[#58a6ff] whitespace-nowrap hidden sm:inline">src</span>
                    <span className="text-gray-500 hidden sm:inline">/</span>
                    <span className="text-[#58a6ff] whitespace-nowrap hidden sm:inline">content</span>
                    <span className="text-gray-500 hidden sm:inline">/</span>
                    <span className="text-[#58a6ff] whitespace-nowrap">posts</span>
                    <span className="text-gray-500">/</span>

                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="min-w-0 flex-1 bg-[#0d1117] text-white outline-none text-sm px-2 py-1 rounded border border-[#30363d] focus:border-[#58a6ff] transition"
                        placeholder="filename.mdx"
                    />

                    <span className="text-gray-500 shrink-0 hidden sm:inline">in</span>
                    <span className="shrink-0 hidden sm:flex items-center gap-1 bg-[#21262d] border border-[#30363d] text-gray-300 text-xs px-2 py-1 rounded-md">
                        <LuGitBranch className="w-3 h-3" />
                        main
                    </span>
                </div>

                <div className="flex gap-2 items-center shrink-0">
                    <button
                        onClick={handleCancelChanges}
                        className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 font-medium py-1.5 px-3 rounded-md text-sm transition"
                    >
                        Cancel changes
                    </button>

                    <button
                        onClick={openCommitDialog}
                        disabled={loading}
                        className="bg-[#238636] hover:bg-[#2ea043] disabled:bg-gray-600 text-white font-medium py-1.5 px-3 rounded-md text-sm transition"
                    >
                        Commit changes...
                    </button>

                    <button
                        onClick={() => setIsAuth(false)}
                        title="登出"
                        className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-300 p-1.5 rounded-md transition"
                    >
                        <LuLogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Edit / Preview toolbar */}
            <div className="border-b border-[#21262d] bg-[#0d1117] px-4 sm:px-6 py-2 flex justify-between items-center">
                <div className="inline-flex bg-[#161b22] border border-[#30363d] rounded-md p-0.5 text-sm">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                            activeTab === 'edit'
                                ? 'bg-[#30363d] text-white'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <LuPencil className="w-3.5 h-3.5" />
                        Edit
                    </button>

                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                            activeTab === 'preview'
                                ? 'bg-[#30363d] text-white'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <LuEye className="w-3.5 h-3.5" />
                        Preview
                    </button>
                </div>

                <button
                    onClick={() => setSoftWrap((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition ${
                        softWrap
                            ? 'bg-[#21262d] border-[#58a6ff] text-[#58a6ff]'
                            : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <LuAlignLeft className="w-3.5 h-3.5" />
                    Soft wrap
                    <LuChevronDown className="w-3 h-3 opacity-60" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden bg-[#0d1117]">
                {activeTab === 'edit' ? (
                    <div className={`admin-editor h-full ${softWrap ? 'soft-wrap' : ''}`}>
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
                ) : (
                    <div className="h-full overflow-y-auto">
                        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8">
                            {parsedPreview ? (
                                <>
                                    <div className="mb-8 pb-6 border-b border-[#21262d]">
                                        <h1 className="text-3xl font-bold text-gray-100 mb-3">
                                            {parsedPreview.frontmatter.title || (
                                                <span className="text-gray-500 italic">
                                                    （未填写标题）
                                                </span>
                                            )}
                                        </h1>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                                            <span>
                                                {parsedPreview.frontmatter.author || 'Shane'}
                                            </span>

                                            {parsedPreview.frontmatter.pubDatetime && (
                                                <span>
                                                    {parsedPreview.frontmatter.pubDatetime}
                                                </span>
                                            )}

                                            {parsedPreview.frontmatter.category && (
                                                <span className="flex items-center gap-1">
                                                    分类：{parsedPreview.frontmatter.category}
                                                </span>
                                            )}

                                            {parsedPreview.frontmatter.draft && (
                                                <span className="bg-[#3d2d00] text-[#e3b341] border border-[#3d2d00] px-2 py-0.5 rounded-full text-xs">
                                                    Draft
                                                </span>
                                            )}
                                        </div>

                                        {parsedPreview.frontmatter.tags && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {String(parsedPreview.frontmatter.tags)
                                                    .split(',')
                                                    .filter(Boolean)
                                                    .map((tag: string) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs bg-[#21262d] border border-[#30363d] text-gray-300 px-2 py-0.5 rounded-full"
                                                        >
                                                            #{tag.trim()}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}

                                        {parsedPreview.frontmatter.description && (
                                            <p className="text-gray-500 mt-3 text-sm italic">
                                                {parsedPreview.frontmatter.description}
                                            </p>
                                        )}
                                    </div>

                                    <div>{renderMarkdown(parsedPreview.body)}</div>
                                </>
                            ) : (
                                <div className="text-gray-400">
                                    <p className="mb-2">
                                        ⚠️ Frontmatter 格式不正确，无法解析元数据，以下按原始内容预览：
                                    </p>
                                    <div>{renderMarkdown(content)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Commit dialog, GitHub-style */}
            {showCommitDialog && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-md w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
                            <h2 className="text-base font-semibold text-gray-100">
                                Commit changes
                            </h2>

                            <button
                                onClick={() => setShowCommitDialog(false)}
                                className="text-gray-400 hover:text-gray-200"
                            >
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <input
                                type="text"
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Commit message"
                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-white focus:border-[#58a6ff] outline-none"
                            />

                            <textarea
                                value={commitDescription}
                                onChange={(e) => setCommitDescription(e.target.value)}
                                placeholder="Extended description"
                                rows={3}
                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-white focus:border-[#58a6ff] outline-none resize-none"
                            />

                            <label className="flex items-start gap-2 text-sm text-gray-300 bg-[#0d1117] border border-[#30363d] rounded-md p-3">
                                <input
                                    type="radio"
                                    checked
                                    readOnly
                                    className="mt-1 accent-[#238636]"
                                />
                                <span>
                                    <span className="block text-gray-100">
                                        Commit directly to the{' '}
                                        <span className="text-[#58a6ff]">main</span> branch.
                                    </span>
                                    <span className="block text-gray-500 text-xs mt-0.5">
                                        文章将被保存并立即发布到数据库。
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#30363d]">
                            <button
                                onClick={() => setShowCommitDialog(false)}
                                className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 font-medium py-1.5 px-4 rounded-md text-sm transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={doSubmit}
                                disabled={loading}
                                className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:bg-gray-600 text-white font-medium py-1.5 px-4 rounded-md text-sm transition"
                            >
                                {loading ? (
                                    <>
                                        <LuLoader className="w-4 h-4 animate-spin" />
                                        Committing...
                                    </>
                                ) : (
                                    <>
                                        <LuCheck className="w-4 h-4" />
                                        Commit changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
