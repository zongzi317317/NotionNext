// pages/llms.txt.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { buildLlmsTxt } from '@/lib/seo/llms'
import { extractLangId } from '@/lib/utils/pageId'

export const getServerSideProps = async ({ res }) => {
  const siteId = BLOG.NOTION_PAGE_ID.split(',')[0]
  const siteData = await fetchGlobalAllData({
    pageId: extractLangId(siteId),
    from: 'llms.txt'
  })
  const NOTION_CONFIG = siteData?.NOTION_CONFIG
  const body = buildLlmsTxt({
    link: siteConfig('LINK', siteData?.siteInfo?.link, NOTION_CONFIG),
    siteInfo: siteData?.siteInfo,
    allPages: siteData?.allPages,
    author: siteConfig('AUTHOR', BLOG.AUTHOR, NOTION_CONFIG),
    publishStatus: BLOG.NOTION_PROPERTY_NAME.status_publish
  })

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=59'
  )
  res.write(body)
  res.end()

  return { props: {} }
}

export default function LlmsTxt() {
  return null
}
