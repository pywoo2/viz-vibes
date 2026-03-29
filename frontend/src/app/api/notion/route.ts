import { NotionAPI } from 'notion-client';

const notion = new NotionAPI();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId');

  if (!pageId) {
    return Response.json({ error: 'pageId is required' }, { status: 400 });
  }

  try {
    const recordMap = await notion.getPage(pageId);
    return Response.json(recordMap, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return Response.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}
