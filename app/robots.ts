import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/_next', '/dashboard'],
    },
    sitemap: 'https://market-source.vercel.app/sitemap.xml',
  }
}
