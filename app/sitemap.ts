import { MetadataRoute } from 'next'
import { getProducts } from '@/lib/database'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://market-source.vercel.app'
  
  // Các trang tĩnh
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]

  // Lấy danh sách sản phẩm đang bán
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const products = await getProducts()
    const activeProducts = products.filter((p: any) => p.is_active)
    
    productRoutes = activeProducts.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  return [...staticRoutes, ...productRoutes]
}
