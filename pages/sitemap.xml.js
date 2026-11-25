// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString
} from '@/lib/sitemap-utils'
import {
  getAllContentLocales,
  getLocalePrefix,
  isContentLocalesEnabled
} from '@/lib/utils/contentLocale'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

export const getServerSideProps = async ctx => {
  let fields = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')
  // 每个条目：{ id: Notion 数据库, fetchLocale: 取数据用的语言, locale: 网址前缀 }
  const sources = siteIds.map(siteId => ({
    id: extractLangId(siteId),
    fetchLocale: undefined,
    locale: extractLangPrefix(siteId)
  }))
  // 同库多语言（conf/i18n.config.js）：同一个数据库按语言各生成一份
  if (isContentLocalesEnabled() && siteIds.length === 1) {
    sources.length = 0
    getAllContentLocales().forEach(lang => {
      sources.push({
        id: extractLangId(siteIds[0]),
        fetchLocale: lang,
        locale: getLocalePrefix(lang)
      })
    })
  }

  for (const { id, fetchLocale, locale } of sources) {
    // 第一个id站点默认语言
    const siteData = await fetchGlobalAllData({
      pageId: id,
      from: 'sitemap.xml',
      locale: fetchLocale
    })
    const link = siteConfig(
      'LINK',
      siteData?.siteInfo?.link,
      siteData.NOTION_CONFIG
    )
    const localeFields = generateLocalesSitemap(link, siteData.allPages, locale)
    fields = fields.concat(localeFields)
  }

  fields = getUniqueFields(fields)

  // 缓存
  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=59'
  )
  return getServerSideSitemap(ctx, fields)
}

function generateLocalesSitemap(link, allPages, locale) {
  const normalizedLink = normalizeSitemapBaseUrl(link)
  const normalizedLocale = normalizeSitemapLocale(locale)
  const dateNow = toSitemapDateString(new Date())

  const defaultFields = [
    {
      loc: buildSitemapLoc({ baseUrl: normalizedLink, locale: normalizedLocale }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'archive'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'category'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'tag'
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    }
  ].filter(field => Boolean(field?.loc))

  const postFields =
    allPages
      ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
      // 过滤掉外部链接(http开头)和锚点链接(#开头)
      ?.filter(p => p.slug && !p.slug.startsWith('http') && !p.slug.startsWith('#'))
      ?.map(post => {
        const loc = buildSitemapLoc({
          baseUrl: normalizedLink,
          locale: normalizedLocale,
          slug: post?.slug
        })
        if (!loc) return null

        return {
          loc,
          lastmod: toSitemapDateString(
            post?.lastEditedDate || post?.publishDate || post?.publishDay,
            dateNow
          ),
          changefreq: 'daily',
          priority: '0.7'
        }
      })
      ?.filter(Boolean) ?? []

  return defaultFields.concat(postFields)
}

function getUniqueFields(fields) {
  const uniqueFieldsMap = new Map()

  fields.forEach(field => {
    const existingField = uniqueFieldsMap.get(field.loc)

    if (!existingField || new Date(field.lastmod) > new Date(existingField.lastmod)) {
      uniqueFieldsMap.set(field.loc, field)
    }
  })

  return Array.from(uniqueFieldsMap.values())
}

export default () => { }
