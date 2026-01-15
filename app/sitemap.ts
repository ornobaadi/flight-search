import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://skyscout.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://skyscout.app/search',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: 'https://skyscout.app/api-test',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ]
}
