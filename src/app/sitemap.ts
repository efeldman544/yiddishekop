import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://yiddishekop.app'
  return [
    { url: base,                          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/start-hiring`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/why-us`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/how-it-works`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,               lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/signup`,              lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy-policy`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
