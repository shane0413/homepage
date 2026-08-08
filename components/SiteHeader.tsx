'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuGithub, LuSearch, LuMenu, LuX } from 'react-icons/lu';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { label: '首页', href: '/' },
  { label: '博客', href: '/blog' },
  { label: '分类', href: '/blog/categories' },
  { label: '标签', href: '/blog/tags' },
  { label: '归档', href: '/blog/archive' },
  { label: '时间轴', href: '/blog/timeline' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-canvas)/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-(--color-fg)">
            @shane0413
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition hover:text-(--color-accent) ${
                  isActive(link.href)
                    ? 'font-medium text-(--color-fg)'
                    : 'text-(--color-fg-muted)'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/blog/search"
            aria-label="搜索文章"
            title="搜索文章"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-fg-muted) transition hover:border-(--color-accent) hover:text-(--color-accent)"
          >
            <LuSearch className="h-4 w-4" />
          </Link>

          <a
            href="https://github.com/shane0413"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-fg-muted) transition hover:border-(--color-accent) hover:text-(--color-accent) sm:flex"
          >
            <LuGithub className="h-4 w-4" />
          </a>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="菜单"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-fg-muted) md:hidden"
          >
            {open ? <LuX className="h-4 w-4" /> : <LuMenu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-(--color-border) px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-md px-2 py-2 text-sm transition hover:bg-(--color-canvas-subtle) ${
                isActive(link.href) ? 'font-medium text-(--color-fg)' : 'text-(--color-fg-muted)'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/shane0413"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2 py-2 text-sm text-(--color-fg-muted) hover:bg-(--color-canvas-subtle)"
          >
            GitHub
          </a>
        </nav>
      )}
    </header>
  );
}
