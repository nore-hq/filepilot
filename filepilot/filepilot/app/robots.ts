import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/private/', '/api/', '/portal/dashboard/', '/portal/client/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/private/', '/portal/dashboard/', '/portal/client/'],
      },
    ],
    sitemap: 'https://norehq.com/sitemap.xml',
    host: 'https://norehq.com',
  }
}