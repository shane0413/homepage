// 给网格（卡片）视图用的小工具：
// - pickLayout: 根据 slug + 当前文章总数 算出一个 0-3 的稳定"伪随机"值，
//   决定卡片是封面在左/封面在右/封面在上/封面在下。
//   因为把"文章总数"也编码进了种子，每次发布新文章、总数变化时，
//   所有卡片的排列都会跟着重新洗一遍，但同一时刻刷新页面结果是稳定的（不会没发新文章却每次刷新都在跳）。
// - pickSize: 根据标题+摘要长度，把卡片分成 sm/md/lg 三档。

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export type CardLayout = 'cover-left' | 'cover-right' | 'cover-top' | 'cover-bottom';

export function pickLayout(slug: string, totalCount: number): CardLayout {
  const layouts: CardLayout[] = [
    'cover-left',
    'cover-right',
    'cover-top',
    'cover-bottom',
  ];
  const seed = hashString(`${slug}:${totalCount}`);
  return layouts[seed % layouts.length];
}

export type CardSize = 'sm' | 'md' | 'lg';

export function pickSize(title: string, excerpt: string | null | undefined): CardSize {
  const length = (title || '').length + (excerpt || '').length;

  if (length < 30) return 'sm';
  if (length < 90) return 'md';
  return 'lg';
}
