'use client';

import Link from 'next/link';
import { LuCalendar, LuPencil, LuFolder, LuEye } from 'react-icons/lu';
import { formatDate, getEffectiveDate, isModified } from '@/lib/format-date';
import { pickLayout, pickAspect } from '@/lib/post-layout';
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
 * 网格（瀑布流）模式：4 种排列方式（封面在左/右/上/下），
 * 根据 slug + 当前文章总数生成的稳定哈希决定。
 * 不再用固定像素高度或 col-span/row-span 撑格子——卡片高度完全由标题、
 * 摘要文字量和封面图的长宽比自然撑开，配合外层的瀑布流容器（CSS columns）
 * 自动排列，不会再出现某一列比另一列短、右边空出一块的情况。
 * 没有封面的文章就是纯文字卡片。
 */
export function PostGridCard({ post, totalCount }: { post: Post; totalCount: number }) {
  const layout = pickLayout(post.slug, totalCount);
  const aspect = pickAspect(post.slug);
  const hasCover = Boolean(post.coverImage);

  const isHorizontal =
    hasCover && (layout === 'cover-left' || layout === 'cover-right');

  const cover = hasCover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.coverImage as string}
      alt=""
      className={
        isHorizontal
          ? `w-2/5 flex-shrink-0 self-stretch object-cover`
          : `w-full flex-shrink-0 object-cover ${aspect}`
      }
    />
  ) : null;

  const body = (
    <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
      <h3 className="font-semibold text-(--color-fg)">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-sm text-(--color-fg-muted)">{post.excerpt}</p>
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
      className={`group flex overflow-hidden rounded-lg border border-(--color-border) bg-(--color-canvas) transition hover:border-(--color-accent) ${
        hasCover ? directionClass : 'flex-col'
      }`}
    >
      {cover}
      {body}
    </Link>
  );
}
