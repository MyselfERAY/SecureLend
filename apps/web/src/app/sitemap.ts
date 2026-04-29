import type { MetadataRoute } from 'next';

async function getArticleSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://securelend-production.up.railway.app'}/api/v1/articles`,
      { next: { revalidate: 3600 } },
    );
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data.map((a: { slug: string }) => a.slug);
    }
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.kiraguvence.com';
  const slugs = await getArticleSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/fiyatlandirma`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/rehber`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/sablonlar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/kvkk`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/gizlilik`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/kullanim-kosullari`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/cerez-politikasi`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/acik-riza`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/veri-talebi`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const articlePages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/rehber/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages];
}
