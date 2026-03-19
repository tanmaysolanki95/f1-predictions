const MOTORSPORT_RSS_URL = "https://www.motorsport.com/rss/f1/news/";

export type NewsItem = {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  pubDate: string;
  category: string | null;
};

function extractTag(xml: string, tag: string): string | null {
  const cdataMatch = xml.match(
    new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`),
  );
  if (cdataMatch) return cdataMatch[1].trim();

  const plainMatch = xml.match(
    new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`),
  );
  return plainMatch ? plainMatch[1].trim() : null;
}

function extractEnclosureUrl(itemXml: string): string | null {
  const match = itemXml.match(/enclosure\s+url="([^"]+)"/);
  return match ? match[1] : null;
}

function stripHtml(html: string): string {
  let result = html.replace(/<br\s*\/?>/gi, " ");
  let prev;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, "");
  } while (result !== prev);
  return result.replace(/\s+/g, " ").trim();
}

function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const rawDesc = extractTag(block, "description");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const category = extractTag(block, "category");

    if (!title || !link) continue;

    items.push({
      title,
      description: rawDesc ? stripHtml(rawDesc) : "",
      url: link,
      imageUrl: extractEnclosureUrl(block),
      pubDate: pubDate ?? new Date().toISOString(),
      category,
    });
  }

  return items;
}

export async function fetchNews(limit: number = 20): Promise<NewsItem[]> {
  const res = await fetch(MOTORSPORT_RSS_URL, {
    next: { revalidate: 900 },
  });

  if (!res.ok) return [];

  const xml = await res.text();
  return parseItems(xml).slice(0, limit);
}
