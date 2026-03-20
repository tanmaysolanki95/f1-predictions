import Card from "@/components/Card";
import Button from "@/components/Button";
import FallbackImage from "@/components/FallbackImage";
import { fetchNews } from "@/lib/newsFeed";

// ISR: revalidate every 15 minutes (900s)
export const revalidate = 900;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function NewsPage() {
  const articles = await fetchNews(20);

  return (
    <main className="p-6 text-[var(--muted)] animate-fade-in space-y-4">
      <Button variant="ghost" size="sm" href="/?from=/news" className="mb-2">
        &larr; Back
      </Button>
      <h1 style={{ fontFamily: 'var(--font-titillium)' }} className="text-2xl font-extrabold text-white">F1 News</h1>
      <p className="text-sm text-[var(--muted)]">Latest from Motorsport.com</p>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles && articles.length > 0 ? (
          articles.map((article) => (
            <a key={article.url} href={article.url} target="_blank" rel="noopener noreferrer" className="block">
              <Card>
                {article.imageUrl ? (
                  <FallbackImage
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-40 object-cover rounded-t-[var(--radius-lg)]"
                  />
                ) : null}
                <div className="p-4">
                  <div style={{ fontFamily: 'var(--font-titillium)' }} className="text-sm font-bold text-white line-clamp-2">
                    {article.title}
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1">{article.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
                    {article.category ? (
                      <span className="px-2 py-1 rounded bg-[var(--border)] text-white text-xs">
                        {article.category}
                      </span>
                    ) : null}
                    <span className="ml-2">{timeAgo(article.pubDate)}</span>
                  </div>
                </div>
              </Card>
            </a>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">No news available</p>
        )}
      </section>
    </main>
  );
}
