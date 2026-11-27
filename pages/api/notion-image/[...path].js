/**
 * Notion 图片中转
 *
 * www.notion.so 在中国大陆无法访问，导致封面和文章图片全部加载失败。
 * 这里由 Vercel 在境外抓取 https://www.notion.so/image/... （会跟随跳转到
 * img.notionusercontent.com），再从本站域名返回，并让 Vercel / Cloudflare 缓存。
 *
 * 例：/api/notion-image/image/https%3A%2F%2Fexample.com%2Fa.jpg?table=block&id=xxx
 *   → https://www.notion.so/image/https%3A%2F%2Fexample.com%2Fa.jpg?table=block&id=xxx
 */
export const config = { runtime: 'edge' }

const PREFIX = '/api/notion-image'
const UPSTREAM = 'https://www.notion.so'

export default async function handler(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 })
  }
  const url = new URL(req.url)
  // 使用原始（未解码）路径，保留内层 URL 中的 %2F
  const rawPath = url.pathname.slice(PREFIX.length)
  if (!/^\/images?\//.test(rawPath)) {
    return new Response('Not Found', { status: 404 })
  }

  let upstream
  try {
    upstream = await fetch(UPSTREAM + rawPath + url.search, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; NotionNext image proxy; +https://github.com/notionnext-org/NotionNext)',
        Accept: req.headers.get('accept') || 'image/*,*/*;q=0.8'
      }
    })
  } catch (e) {
    return new Response('Bad Gateway', { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') || ''
  if (!upstream.ok || !/^image\//i.test(contentType)) {
    return new Response('Bad Gateway', {
      status: upstream.ok ? 502 : upstream.status,
      headers: { 'Cache-Control': 'public, max-age=60' }
    })
  }

  const headers = new Headers({
    'Content-Type': contentType,
    // 浏览器缓存 1 天；CDN（Vercel / Cloudflare）缓存 30 天
    'Cache-Control':
      'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, max-age=2592000',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff'
  })
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)

  return new Response(req.method === 'HEAD' ? null : upstream.body, {
    status: 200,
    headers
  })
}
