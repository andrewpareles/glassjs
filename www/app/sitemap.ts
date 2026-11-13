
export const baseUrl = process.env.BASE_URL ?? ''

export default async function sitemap() {
  let routes = ['', '/get-started'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes,]
}
