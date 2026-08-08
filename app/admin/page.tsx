'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    LuPlus,
    LuUpload,
    LuFilePlus,
    LuDownload,
    LuTrash2,
    LuSearch,
    LuArrowLeft,
    LuCalendar,
    LuStar,
    LuLayoutGrid,
} from 'react-icons/lu';
import {
    nowTaipeiISOString,
    isModified,
    getEffectiveDate,
    groupPostsByMonth,
    formatDate,
} from '@/lib/format-date';

interface AdminPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    category?: string | null;
    author?: string | null;
    tags?: string | null;
    featured?: boolean | null;
    draft?: boolean | null;
    views?: number | null;
    pubDatetime: string;
    modifiedDatetime?: string | null;
}

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isAuth, setIsAuth] = useState(false);
    const [authToken, setAuthToken] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    // 'list' = 文章管理列表（登录后的首页），'editor' = GitHub 风格编辑器
    const [view, setView] = useState<'list' | 'editor'>('list');

    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 正在编辑的文章原始 slug；null 表示这是一篇新文章
    const [editingSlug, setEditingSlug] = useState<string | null>(null);

    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
    const [showCreateMenu, setShowCreateMenu] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const buildDefaultContent = () => `---
author: Shane
pubDatetime: ${nowTaipeiISOString()}
modifiedDatetime: 
title: 
featured: false
draft: true
tags:
- 
category: 
description: 
coverImage: 
---
# 开始写文章`;

    const [content, setContent] = useState(buildDefaultContent);
    // 记录进入编辑器那一刻的内容，用于判断"是否有未保存的修改"
    const baselineRef = useRef({ fileName: '', content: buildDefaultContent() });

    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [softWrap, setSoftWrap] = useState(true);
    const [showCommitDialog, setShowCommitDialog] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [commitDescription, setCommitDescription] = useState('');

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    // 统一给管理类请求附带管理员密码请求头
    const adminFetch = (url: string, options: RequestInit = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': authToken,
                ...(options.headers || {}),
            },
        });
    };

    const handleSessionExpired = () => {
        showToast('error', '登录已过期，请重新登录');
        setIsAuth(false);
        setAuthToken('');
    };

    const fetchPostList = async (token: string) => {
        setListLoading(true);
        setListError('');

        try {
            const res = await fetch('/api/admin/posts', {
                headers: { 'x-admin-password': token },
            });

            if (res.status === 401) {
                handleSessionExpired();
                return;
            }

            if (!res.ok) {
                throw new Error('获取文章列表失败');
            }

            const data = await res.json();
            setPosts(Array.isArray(data) ? data : []);
        } catch (err) {
            setListError(String(err));
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        if (isAuth && authToken) {
            fetchPostList(authToken);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuth, authToken]);

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
                setAuthToken(password);
                setIsAuth(true);
                setPassword('');
                setView('list');
            } else {
                showToast('error', '密码错误');
            }
        } catch (err) {
            showToast('error', '验证失败：' + String(err));
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = () => {
        setIsAuth(false);
        setAuthToken('');
        setPosts([]);
        setView('list');
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
            } else if (line.startsWith('modifiedDatetime:')) {
                data.modifiedDatetime = line.replace('modifiedDatetime:', '').trim();
            } else if (line.startsWith('featured:')) {
                data.featured = line.includes('true');
            } else if (line.startsWith('draft:')) {
                data.draft = line.includes('true');
            } else if (line.startsWith('category:')) {
                data.category = line.replace('category:', '').trim();
            } else if (line.startsWith('description:')) {
                data.description = line.replace('description:', '').trim();
            } else if (line.startsWith('coverImage:')) {
                data.coverImage = line.replace('coverImage:', '').trim();
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

    const isDirty = () => {
        return (
            content !== baselineRef.current.content ||
            fileName !== baselineRef.current.fileName
        );
    };

    const resetEditorState = () => {
        const fresh = buildDefaultContent();
        setFileName('');
        setContent(fresh);
        setActiveTab('edit');
        setEditingSlug(null);
        baselineRef.current = { fileName: '', content: fresh };
    };

    const openNewPost = () => {
        resetEditorState();
        setShowCreateMenu(false);
        setView('editor');
    };

    const openImportPicker = () => {
        setShowCreateMenu(false);
        fileInputRef.current?.click();
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const text = String(reader.result || '');
            const name = /\.(md|mdx)$/i.test(file.name) ? file.name : `${file.name}.mdx`;

            setContent(text);
            setFileName(name);
            setEditingSlug(null);
            setActiveTab('edit');
            setView('editor');
            baselineRef.current = { fileName: name, content: text };
            showToast('success', `已导入 ${file.name}，检查无误后请点击 Commit changes 发布`);
        };

        reader.onerror = () => showToast('error', '文件读取失败');
        reader.readAsText(file);

        // 允许重复选择同一个文件
        e.target.value = '';
    };

    const openEditPost = async (post: AdminPost) => {
        try {
            const res = await adminFetch(`/api/admin/posts/${post.slug}`);

            if (!res.ok) {
                showToast('error', '加载文章失败');
                return;
            }

            const full = await res.json();

            const tagsList = String(full.tags || '')
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean);

            const tagsBlock = tagsList.length
                ? tagsList.map((t: string) => `- ${t}`).join('\n')
                : '- ';

            const pubText = full.pubDatetime
                ? nowTaipeiISOString(new Date(full.pubDatetime))
                : nowTaipeiISOString();

            // 每次进入编辑都会自动把"修改日期"填为当前台北时间；
            // 如果不希望这次改动被标记为"已修改"，可以在编辑器里手动清空这一行。
            const modifiedText = nowTaipeiISOString();

            const built = `---
author: ${full.author || 'Shane'}
pubDatetime: ${pubText}
modifiedDatetime: ${modifiedText}
title: ${full.title || ''}
featured: ${full.featured ? 'true' : 'false'}
draft: ${full.draft ? 'true' : 'false'}
tags:
${tagsBlock}
category: ${full.category || ''}
description: ${full.excerpt || ''}
coverImage: ${full.coverImage || ''}
---
${full.content || ''}`;

            const nameForFile = `${full.slug}.mdx`;

            setContent(built);
            setFileName(nameForFile);
            setEditingSlug(full.slug);
            setActiveTab('edit');
            setView('editor');
            baselineRef.current = { fileName: nameForFile, content: built };
        } catch (err) {
            showToast('error', '加载文章失败：' + String(err));
        }
    };

    const handleDeletePost = async (post: AdminPost) => {
        if (!window.confirm(`确定要删除《${post.title || post.slug}》吗？此操作无法撤销。`)) {
            return;
        }

        setDeletingSlug(post.slug);

        try {
            const res = await adminFetch(`/api/admin/posts/${post.slug}`, {
                method: 'DELETE',
            });

            if (res.status === 401) {
                handleSessionExpired();
                return;
            }

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                showToast('error', error.error || '删除失败');
                return;
            }

            showToast('success', '文章已删除');
            setPosts((prev) => prev.filter((p) => p.slug !== post.slug));

            if (editingSlug === post.slug) {
                resetEditorState();
                setView('list');
            }
        } catch (err) {
            showToast('error', '删除失败：' + String(err));
        } finally {
            setDeletingSlug(null);
        }
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
                .replace(/\.mdx?$/i, '')
                .toLowerCase();

            const pubDatetime =
                parsed.frontmatter.pubDatetime &&
                !isNaN(Date.parse(parsed.frontmatter.pubDatetime))
                    ? new Date(parsed.frontmatter.pubDatetime)
                    : new Date();

            // 修改日期字段：留空 / 被删除 -> 视为"未修改过"，存 null。
            const modifiedRaw = parsed.frontmatter.modifiedDatetime;
            const modifiedDatetime =
                modifiedRaw && !isNaN(Date.parse(modifiedRaw))
                    ? new Date(modifiedRaw)
                    : null;

            const isEditing = !!editingSlug;

            const res = await adminFetch(
                isEditing ? `/api/admin/posts/${editingSlug}` : '/api/admin/posts',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        title: parsed.frontmatter.title || '',
                        slug,

                        excerpt:
                            parsed.frontmatter.description || '',

                        coverImage:
                            parsed.frontmatter.coverImage || '',

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
                        modifiedDatetime,
                    }),
                }
            );

            if (res.status === 401) {
                handleSessionExpired();
                return;
            }

            if (res.ok) {
                showToast('success', isEditing ? '文章更新成功' : '文章发布成功');

                resetEditorState();
                setShowCommitDialog(false);
                setCommitMessage('');
                setCommitDescription('');
                setView('list');
                fetchPostList(authToken);
            } else {
                const error = await res.json();

                showToast(
                    'error',
                    error.error || (isEditing ? '更新失败' : '发布失败')
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

        const cleanName = fileName.replace(/\.mdx?$/i, '');

        setCommitMessage(
            editingSlug
                ? `Update ${cleanName}.mdx`
                : `Create ${cleanName}.mdx`
        );
        setCommitDescription('');
        setShowCommitDialog(true);
    };

    const handleCancelChanges = () => {
        if (isDirty() && !window.confirm('放弃当前修改？此操作无法撤销。')) {
            return;
        }

        resetEditorState();
        setView('list');
    };

    const handleExport = () => {
        const name = fileName
            ? (/\.mdx?$/i.test(fileName) ? fileName : `${fileName}.mdx`)
            : 'untitled.mdx';

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    const filteredPosts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return posts;

        return posts.filter((p) =>
            [p.title, p.slug, p.category, p.author]
                .filter(Boolean)
                .some((field) => String(field).toLowerCase().includes(q))
        );
    }, [posts, searchQuery]);

    const monthGroups = useMemo(
        () =>
            groupPostsByMonth(filteredPosts, (p) =>
                getEffectiveDate(p.pubDatetime, p.modifiedDatetime)
            ),
        [filteredPosts]
    );

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

            {/* 隐藏的文件选择器，用于导入本地 md/mdx */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.mdx,text/markdown"
                className="hidden"
                onChange={handleImportFile}
            />

            {view === 'list' ? (
                <>
                    {/* 文章管理列表 - 顶部栏 */}
                    <div className="border-b border-[#21262d] bg-[#0d1117] px-4 sm:px-6 py-3 flex flex-wrap gap-3 justify-between items-center">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                            <LuFileCode className="w-4 h-4 text-[#58a6ff] shrink-0" />
                            <span className="text-[#58a6ff] whitespace-nowrap">shane-blog</span>
                            <span className="text-gray-500">/</span>
                            <span className="text-gray-300 whitespace-nowrap">文章管理</span>
                            <span className="shrink-0 hidden sm:flex items-center gap-1 bg-[#21262d] border border-[#30363d] text-gray-300 text-xs px-2 py-1 rounded-md ml-1">
                                <LuGitBranch className="w-3 h-3" />
                                main
                            </span>
                        </div>

                        <div className="flex gap-2 items-center shrink-0">
                            <div className="relative hidden sm:block">
                                <LuSearch className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索文章..."
                                    className="bg-[#0d1117] border border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-sm text-white focus:border-[#58a6ff] outline-none w-48"
                                />
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowCreateMenu((v) => !v)}
                                    title="新建 / 导入"
                                    className="flex items-center gap-1 bg-[#238636] hover:bg-[#2ea043] text-white p-1.5 rounded-md transition"
                                >
                                    <LuPlus className="w-4 h-4" />
                                    <LuChevronDown className="w-3 h-3 opacity-80" />
                                </button>

                                {showCreateMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowCreateMenu(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl z-50 overflow-hidden">
                                            <button
                                                onClick={openNewPost}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-200 hover:bg-[#1f6feb26] text-left transition"
                                            >
                                                <LuFilePlus className="w-4 h-4 text-gray-400" />
                                                <span>
                                                    <span className="block">新建文章</span>
                                                    <span className="block text-xs text-gray-500">
                                                        从空白模板开始
                                                    </span>
                                                </span>
                                            </button>
                                            <div className="border-t border-[#30363d]" />
                                            <button
                                                onClick={openImportPicker}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-200 hover:bg-[#1f6feb26] text-left transition"
                                            >
                                                <LuUpload className="w-4 h-4 text-gray-400" />
                                                <span>
                                                    <span className="block">导入 Markdown</span>
                                                    <span className="block text-xs text-gray-500">
                                                        从本地 .md / .mdx 文件导入
                                                    </span>
                                                </span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleLogout}
                                title="登出"
                                className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-300 p-1.5 rounded-md transition"
                            >
                                <LuLogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* 移动端搜索框 */}
                    <div className="sm:hidden px-4 py-2 border-b border-[#21262d]">
                        <div className="relative">
                            <LuSearch className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索文章..."
                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-sm text-white focus:border-[#58a6ff] outline-none"
                            />
                        </div>
                    </div>

                    {/* 文章列表 */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                        <div className="max-w-4xl mx-auto">
                            {listLoading ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-10 justify-center">
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                    加载中...
                                </div>
                            ) : listError ? (
                                <div className="text-[#f85149] text-sm py-10 text-center">
                                    {listError}
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="text-gray-500 text-sm py-16 text-center">
                                    {posts.length === 0
                                        ? '还没有文章，点击右上角「+」新建或导入一篇吧'
                                        : '没有匹配的文章'}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {monthGroups.map((group) => (
                                        <section key={group.key}>
                                            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-2 px-1">
                                                {group.label}
                                            </h2>

                                            <div className="border border-[#30363d] rounded-md divide-y divide-[#21262d] overflow-hidden bg-[#0d1117]">
                                                {group.items.map((post) => {
                                                    const modified = isModified(post.modifiedDatetime);
                                                    const effective = getEffectiveDate(
                                                        post.pubDatetime,
                                                        post.modifiedDatetime
                                                    );

                                                    return (
                                                        <div
                                                            key={post.id}
                                                            onClick={() => openEditPost(post)}
                                                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#161b22] cursor-pointer transition group"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm text-gray-100 font-medium truncate">
                                                                        {post.title || (
                                                                            <span className="italic text-gray-500">
                                                                                （未命名）
                                                                            </span>
                                                                        )}
                                                                    </span>

                                                                    {post.draft && (
                                                                        <span className="shrink-0 text-[10px] bg-[#3d2d00] text-[#e3b341] border border-[#e3b34133] px-1.5 py-0.5 rounded-full">
                                                                            Draft
                                                                        </span>
                                                                    )}

                                                                    {post.featured && (
                                                                        <LuStar
                                                                            className="w-3 h-3 text-[#58a6ff] shrink-0"
                                                                            title="精选"
                                                                        />
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                                                                    <span
                                                                        className="flex items-center gap-1"
                                                                        title={modified ? '最后修改日期' : '发布日期，尚未修改过'}
                                                                    >
                                                                        {modified ? (
                                                                            <LuPencil className="w-3 h-3 text-amber-400" />
                                                                        ) : (
                                                                            <LuCalendar className="w-3 h-3" />
                                                                        )}
                                                                        {formatDate(effective)}
                                                                    </span>

                                                                    {post.category && (
                                                                        <span className="flex items-center gap-1">
                                                                            <LuLayoutGrid className="w-3 h-3" />
                                                                            {post.category}
                                                                        </span>
                                                                    )}

                                                                    <span className="flex items-center gap-1">
                                                                        <LuEye className="w-3 h-3" />
                                                                        {post.views ?? 0}
                                                                    </span>

                                                                    <span className="text-gray-600">/{post.slug}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditPost(post);
                                                                    }}
                                                                    title="编辑"
                                                                    className="p-1.5 rounded-md hover:bg-[#30363d] text-gray-400 hover:text-gray-100 transition"
                                                                >
                                                                    <LuPencil className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeletePost(post);
                                                                    }}
                                                                    disabled={deletingSlug === post.slug}
                                                                    title="删除"
                                                                    className="p-1.5 rounded-md hover:bg-[#da363326] text-gray-400 hover:text-[#f85149] transition disabled:opacity-50"
                                                                >
                                                                    {deletingSlug === post.slug ? (
                                                                        <LuLoader className="w-3.5 h-3.5 animate-spin" />
                                                                    ) : (
                                                                        <LuTrash2 className="w-3.5 h-3.5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Repo-style top bar */}
                    <div className="border-b border-[#21262d] bg-[#0d1117] px-4 sm:px-6 py-3 flex flex-wrap gap-3 justify-between items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
                            <button
                                onClick={handleCancelChanges}
                                title="返回文章列表"
                                className="text-gray-400 hover:text-gray-100 shrink-0 mr-1"
                            >
                                <LuArrowLeft className="w-4 h-4" />
                            </button>

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

                            {editingSlug && (
                                <span className="shrink-0 hidden md:inline text-xs text-gray-500">
                                    正在编辑已发布文章
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 items-center shrink-0">
                            <button
                                onClick={handleExport}
                                title="导出为文件"
                                className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 font-medium py-1.5 px-3 rounded-md text-sm transition"
                            >
                                <LuDownload className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Export</span>
                            </button>

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
                                onClick={handleLogout}
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
                                                    <span className="flex items-center gap-1">
                                                        <LuCalendar className="w-3.5 h-3.5" />
                                                        {parsedPreview.frontmatter.pubDatetime || '未设置发布日期'}
                                                    </span>

                                                    {isModified(parsedPreview.frontmatter.modifiedDatetime) && (
                                                        <span
                                                            className="flex items-center gap-1"
                                                            title="最后一次修改日期"
                                                        >
                                                            <LuPencil className="w-3.5 h-3.5 text-amber-400" />
                                                            {parsedPreview.frontmatter.modifiedDatetime}
                                                        </span>
                                                    )}

                                                    <span>
                                                        {parsedPreview.frontmatter.author || 'Shane'}
                                                    </span>

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
                </>
            )}

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
                                        {editingSlug
                                            ? '文章修改将被保存并立即更新到数据库。'
                                            : '文章将被保存并立即发布到数据库。'}
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
