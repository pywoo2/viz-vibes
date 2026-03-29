export interface Post {
  notionId: string;
  slug: string;
  title: string;
  date: string;
  description: string;
}

export const posts: Post[] = [
  {
    notionId: '3321eff1cf488087b71aebc4fab2e3bc',
    slug: 'building-viz-vibes',
    title: 'Building Viz-Vibes',
    date: '2026-03-29',
    description: 'Personal expression in the age of AI — and how this site got built in a weekend.',
  },
  {
    notionId: '20a1eff1cf4880c8a0e5ce9a65657b82',
    slug: 'rekindling-a-love',
    title: 'Rekindling A Love',
    date: '2025-06-05',
    description: 'My relationship with running — from COVID addiction to something deeper.',
  },
];
