import site from '@/data/site.json';
import type { Article } from '@/data/articles';

export function getArticleLocale(article: Article): 'en' | 'nl' {
  if ('locale' in article && (article.locale === 'en' || article.locale === 'nl')) {
    return article.locale;
  }
  return article.collection === 'English collection' ? 'en' : 'nl';
}

export function getArticlesForLocale(locale: 'en' | 'nl' = 'en'): Article[] {
  const filtered = site.articles.filter(a => getArticleLocale(a) === locale);
  const seen = new Set<string>();
  const result: Article[] = [];

  // Prioritize canonical English collection over duplicates in Main collection
  const prioritized = [...filtered].sort((a, b) => {
    if (a.title.toLowerCase().trim() === b.title.toLowerCase().trim()) {
      if (a.collection === 'English collection') return -1;
      if (b.collection === 'English collection') return 1;
    }
    return 0;
  });

  for (const a of prioritized) {
    const key = a.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(a);
  }

  return result;
}

export async function getArticles() {
  return site.articles;
}
