// 给网格（卡片）视图用的小工具：
// - pickLayout: 根据 slug + 当前文章总数 算出一个 0-3 的稳定"伪随机"值，
//   决定卡片是封面在左/封面在右/封面在上/封面在下。
//   因为把"文章总数"也编码进了种子，每次发布新文章、总数变化时，
//   所有卡片的排列都会跟着重新洗一遍，但同一时刻刷新页面结果是稳定的（不会没发新文章却每次刷新都在跳）。
// - pickSize: 根据标题+摘要长度，把卡片分成 sm/md/lg 三档。

// 给网格（卡片）视图用的小工具：
// - pickLayout: 根据 slug + 当前文章总数算出一个 0-3 的稳定"伪随机"值，
//   决定卡片是封面在左/封面在右/封面在上/封面在下。
//   因为把"文章总数"也编码进了种子，每次发布新文章、总数变化时，
//   所有卡片的排列都会跟着重新洗一遍，但同一时刻刷新页面结果是稳定的（不会没发新文章却每次刷新都在跳）。
// - pickAspect: 给"封面在上/下"这两种竖排布局的封面图选一个随机长宽比，
//   让瀑布流里每张卡片的封面高度自然不同（不再是固定像素高度）。

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

const ASPECT_RATIOS = ['aspect-[4/3]', 'aspect-[16/9]', 'aspect-square', 'aspect-[3/4]'];

export function pickAspect(slug: string): string {
  const seed = hashString(`aspect:${slug}`);
  return ASPECT_RATIOS[seed % ASPECT_RATIOS.length];
}
