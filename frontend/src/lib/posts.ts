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
  {
    slug: 'building-the-visualizer',
    title: 'Building the Visualizer',
    date: '2026-03-25',
    description: 'How WebGL shaders turn frequency data into a living, breathing canvas.',
  },
  {
    slug: 'ai-music-process',
    title: 'How the AI Music Gets Made',
    date: '2026-03-20',
    description: 'Prompts, curation, and the creative decisions behind AI-generated tracks.',
  },
  {
    slug: 'design-inspiration',
    title: 'Design Inspiration: Glass, Space, and MySpace',
    date: '2026-03-15',
    description: 'The mood board behind the viz-vibes aesthetic — from iOS blur to early internet energy.',
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
