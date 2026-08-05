import { MDXRemote } from 'next-mdx-remote/rsc';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  published: boolean;
  createdAt: number;
  views: number;
}

async function getPost(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/posts/${slug}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return {
    title: post?.title || 'Post',
    description: post?.excerpt || '',
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post: Post | null = await getPost(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-gray-400">文章未找到</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <a href="/blog" className="text-green-400 hover:underline mb-8 block">
          ← 返回博客
        </a>
        
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex gap-4 text-sm text-gray-400 mb-8">
          <span>{post.views} views</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>

        <article className="prose prose-invert max-w-none">
          <MDXRemote source={post.content} />
        </article>
      </div>
    </div>
  );
}