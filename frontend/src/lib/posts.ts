export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export const posts: Post[] = [
  {
    slug: 'hello-world',
    title: 'Hello, World',
    date: '2026-03-28',
    description: 'Welcome to the viz-vibes blog — thoughts on music, code, and creative experiments.',
  },
];

const postContentCache: Record<string, string> = {};

export async function getPostContent(slug: string): Promise<string> {
  if (postContentCache[slug]) return postContentCache[slug];

  const res = await fetch(`/content/${slug}.md`);
  if (!res.ok) throw new Error(`Post not found: ${slug}`);
  const text = await res.text();
  postContentCache[slug] = text;
  return text;
}
