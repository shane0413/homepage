'use client';

import Link from 'next/link';
import { LuCalendar, LuPencil, LuFolder, LuEye } from 'react-icons/lu';
import { formatDate, getEffectiveDate, isModified } from '@/lib/format-date';
import { pickLayout, pickSize } from '@/lib/post-layout';
import type { Post } from '@/lib/types';

function Meta({ post }: { post: Post }) {
  const modified = isModified(post.modifiedDatetime);
  const effective = getEffectiveDate(post.pubDatetime, post.modifiedDatetime);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-(--color-fg-muted)">
      <span className="flex items-center gap-1" title={modified ? '最后修改日期' : '发布日期'}>
        {modified ? (
          <LuPencil className="h-3.5 w-3.5 text-(--color-attention)" />
        ) : (
          <LuCalendar className="h-3.5 w-3.5" />
        )}
        {formatDate(effective)}
      </span>
      {post.category && (
        <span className="flex items-center gap-1">
          <LuFolder className="h-3.5 w-3.5" />
          {post.category}
        </span>
      )}
      <span className="flex items-center gap-1">
        <LuEye className="h-3.5 w-3.5" />
        {post.views}
      </span>
    </div>
  );
}

/** 列表模式：统一大小的横向条目，描述超出用省略号截断，有封面就显示小图。 */
export function PostListItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-canvas) p-4 transition hover:border-(--color-accent)"
    >
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-(--color-fg)">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-(--color-fg-muted)">
            {post.excerpt}
          </p>
        )}
        <div className="mt-2">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}

/**
 * 网格（卡片）模式：4 种排列方式（封面在左/右/上/下），
 * 根据 slug + 当前文章总数生成的稳定哈希决定，
 * 卡片大小按标题+描述长度分 sm/md/lg 三档，长内容占更大的网格空间。
 */
export function PostGridCard({ post, totalCount }: { post: Post; totalCount: number }) {
  const layout = pickLayout(post.slug, totalCount);
  const size = pickSize(post.title, post.excerpt);
  const hasCover = Boolean(post.coverImage);

  const spanClass =
    size === 'lg'
      ? 'sm:col-span-2 sm:row-span-2'
      : size === 'md'
        ? 'sm:col-span-2 sm:row-span-1'
        : 'sm:col-span-1 sm:row-span-1';

  const isHorizontal =
    hasCover && (layout === 'cover-left' || layout === 'cover-right');
  const isVertical = hasCover && (layout === 'cover-top' || layout === 'cover-bottom');

  const cover = hasCover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.coverImage as string}
      alt=""
      className={
        isHorizontal
          ? 'h-full w-2/5 flex-shrink-0 object-cover'
          : 'h-36 w-full flex-shrink-0 object-cover'
      }
    />
  ) : null;

  const body = (
    <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
      <h3 className="font-semibold text-(--color-fg) line-clamp-2">
        {post.title}
      </h3>
      {post.excerpt && (
        <p
          className={`text-sm text-(--color-fg-muted) ${
            size === 'sm' ? 'line-clamp-2' : 'line-clamp-3'
          }`}
        >
          {post.excerpt}
        </p>
      )}
      <div className="mt-auto pt-1">
        <Meta post={post} />
      </div>
    </div>
  );

  const directionClass =
    layout === 'cover-left'
      ? 'flex-row'
      : layout === 'cover-right'
        ? 'flex-row-reverse'
        : layout === 'cover-top'
          ? 'flex-col'
          : 'flex-col-reverse';

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex overflow-hidden rounded-lg border border-(--color-border) bg-(--color-canvas) transition hover:border-(--color-accent) ${spanClass} ${
        hasCover ? directionClass : 'flex-col'
      }`}
    >
      {cover}
      {body}
    </Link>
  );
}
