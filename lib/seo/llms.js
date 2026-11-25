import { buildSitemapLoc, normalizeSitemapBaseUrl } from '@/lib/sitemap-utils'

const clean = text =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim()

const isPublishedInternalPage = (page, publishStatus) =>
  page?.status === publishStatus &&
  page?.slug &&
  !String(page.slug).startsWith('http') &&
  !String(page.slug).startsWith('#')

const toTime = page => {
  const time = new Date(page?.publishDate || page?.publishDay || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}

/**
 * 生成 llms.txt（https://llmstxt.org）：给 AI 搜索 / 大模型的站点摘要与文章索引
 */
export function buildLlmsTxt({
  link,
  siteInfo,
  allPages,
  author,
  publishStatus = 'Published'
}) {
  const base = normalizeSitemapBaseUrl(link)
  const title = clean(siteInfo?.title) || base
  const description = clean(siteInfo?.description)

  const published = (allPages || []).filter(page =>
    isPublishedInternalPage(page, publishStatus)
  )
  const posts = published
    .filter(page => page.type === 'Post')
    .sort((a, b) => toTime(b) - toTime(a))
  const pages = published.filter(page => page.type === 'Page')

  const line = page => {
    const url = buildSitemapLoc({ baseUrl: base, slug: page.slug })
    const meta = [
      page.category && `分類：${clean(page.category)}`,
      page.publishDay && `發布：${clean(page.publishDay)}`
    ]
      .filter(Boolean)
      .join('；')
    const summary = clean(page.summary)
    return `- [${clean(page.title)}](${url})${summary ? `: ${summary}` : ''}${meta ? `（${meta}）` : ''}`
  }

  const out = [`# ${title}`, '']
  if (description) out.push(`> ${description}`, '')
  out.push(
    `${title} 以繁體中文整理韓國首爾皮膚科與醫美資訊，包括療程說明、診所介紹、價格比較與赴韓就診須知。${author ? `作者：${clean(author)}。` : ''}內容僅供參考，不構成醫療建議。`,
    ''
  )

  if (posts.length > 0) {
    out.push('## Articles', '')
    posts.forEach(page => out.push(line(page)))
    out.push('')
  }

  if (pages.length > 0) {
    out.push('## Pages', '')
    pages.forEach(page => out.push(line(page)))
    out.push('')
  }

  out.push('## Optional', '')
  out.push(`- [Sitemap](${base}/sitemap.xml)`)
  out.push(`- [RSS](${base}/rss/feed.xml)`)
  out.push('')

  return out.join('\n')
}
