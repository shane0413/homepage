// 统一使用台北时区 (UTC+8，无夏令时) 做日期展示与自动填时，
// 避免服务器运行环境时区（例如 Vercel 默认 UTC）导致的日期错位问题。

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toTaipeiParts(date: Date) {
  const t = new Date(date.getTime() + TAIPEI_OFFSET_MS);

  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth() + 1,
    day: t.getUTCDate(),
    hour: t.getUTCHours(),
    minute: t.getUTCMinutes(),
    second: t.getUTCSeconds(),
  };
}

/** 形如 2026.08.08 */
export function formatDate(
  date: Date | string | number | null | undefined
): string {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '';

  const { year, month, day } = toTaipeiParts(d);

  return `${year}.${pad(month)}.${pad(day)}`;
}

/** 形如 2026.08.08 13:45 */
export function formatDateTime(
  date: Date | string | number | null | undefined
): string {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '';

  const { year, month, day, hour, minute } = toTaipeiParts(d);

  return `${year}.${pad(month)}.${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

/** 当前台北时间，形如 2026-08-08T13:45:00+08:00，用于自动写入 frontmatter */
export function nowTaipeiISOString(date: Date = new Date()): string {
  const { year, month, day, hour, minute, second } = toTaipeiParts(date);

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(
    second
  )}+08:00`;
}

/** 判断是否存在有效的"修改日期" */
export function isModified(
  modifiedDatetime: Date | string | number | null | undefined
): boolean {
  if (!modifiedDatetime) return false;

  const d = new Date(modifiedDatetime);

  return !isNaN(d.getTime());
}

/** 列表排序/分栏使用的"有效日期"：有修改日期用修改日期，否则用发布日期 */
export function getEffectiveDate(
  pubDatetime: Date | string | number | null | undefined,
  modifiedDatetime: Date | string | number | null | undefined
): Date {
  if (isModified(modifiedDatetime)) {
    return new Date(modifiedDatetime as Date | string | number);
  }

  return new Date(pubDatetime || Date.now());
}

export interface MonthGroup<T> {
  key: string;
  label: string;
  items: T[];
}

/**
 * 按"有效日期"所在的（台北时区）年月对文章分栏，栏内按日期倒序。
 * 同一篇文章如果 3 月发布、7 月修改，会被分到 7 月这一栏。
 */
export function groupPostsByMonth<T>(
  items: T[],
  getDate: (item: T) => Date
): MonthGroup<T>[] {
  const sorted = [...items].sort(
    (a, b) => getDate(b).getTime() - getDate(a).getTime()
  );

  const groups: MonthGroup<T>[] = [];
  const map = new Map<string, MonthGroup<T>>();

  for (const item of sorted) {
    const { year, month } = toTaipeiParts(getDate(item));
    const key = `${year}-${pad(month)}`;
    const label = `${year} 年 ${month} 月`;

    let group = map.get(key);

    if (!group) {
      group = { key, label, items: [] };
      map.set(key, group);
      groups.push(group);
    }

    group.items.push(item);
  }

  return groups;
}
