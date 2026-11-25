import BLOG from '@/blog.config'

/**
 * 同庫多語言（方案 A）工具函數
 * 見 conf/i18n.config.js
 */

/** 與預設語言共用同一個資料庫的其他語言，例如 ['en'] */
export function getExtraContentLocales() {
  // 原生多資料庫方案（NOTION_PAGE_ID 含逗號）時不啟用
  if (String(BLOG.NOTION_PAGE_ID || '').includes(',')) return []
  return Array.isArray(BLOG.CONTENT_LOCALES) ? BLOG.CONTENT_LOCALES : []
}

/** 全部語言，預設語言排第一 */
export function getAllContentLocales() {
  return [BLOG.LANG, ...getExtraContentLocales()]
}

export function isContentLocalesEnabled() {
  return getExtraContentLocales().length > 0
}

/** 把 Next.js 的 locale 換算成內容語言；未知的 locale 一律視為預設語言 */
export function resolveContentLang(locale) {
  if (!isContentLocalesEnabled()) return null
  return getExtraContentLocales().includes(locale) ? locale : BLOG.LANG
}

export function isDefaultContentLang(lang) {
  return !lang || lang === BLOG.LANG
}

function sameLang(a, b) {
  const x = String(a || '').trim().toLowerCase().replace('_', '-')
  const y = String(b || '').trim().toLowerCase().replace('_', '-')
  if (!x || !y) return false
  return x === y || x.split('-')[0] === y.split('-')[0]
}

/** 取得頁面在 Notion lang 欄位中標記的語言（陣列） */
export function getPageLangs(page) {
  const raw = page?.[BLOG.CONTENT_LANG_PROPERTY || 'lang']
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : String(raw).split(',')
  return list.map(v => String(v).trim()).filter(Boolean)
}

/**
 * 頁面是否屬於某個內容語言
 * lang 欄位留空的頁面屬於預設語言；Config 頁面屬於所有語言
 */
export function pageMatchesContentLang(page, lang) {
  if (!lang) return true
  if (page?.type === 'Config') return true
  const langs = getPageLangs(page)
  if (langs.length === 0) return isDefaultContentLang(lang)
  return langs.some(l => sameLang(l, lang))
}

/**
 * 套用某語言的配置覆蓋：
 * 1. conf/i18n.config.js 中 CONTENT_LOCALE_CONFIG[lang]
 * 2. Notion 配置表中「配置名_EN」這類帶語言後綴的行（優先）
 */
export function applyContentLocaleConfig(NOTION_CONFIG = {}, lang) {
  if (!lang || isDefaultContentLang(lang)) return NOTION_CONFIG
  const suffix = '_' + String(lang).split('-')[0].toUpperCase()
  const fromNotion = {}
  Object.keys(NOTION_CONFIG || {}).forEach(key => {
    if (key.endsWith(suffix) && key.length > suffix.length) {
      fromNotion[key.slice(0, -suffix.length)] = NOTION_CONFIG[key]
    }
  })
  return {
    ...NOTION_CONFIG,
    ...(BLOG.CONTENT_LOCALE_CONFIG?.[lang] || {}),
    ...fromNotion,
    LANG: lang
  }
}

/** 把站內路徑規範成可比較的形式：去掉 query / hash / 結尾斜線，解碼 */
export function normalizeLocalePath(path) {
  let p = String(path || '/').split(/[?#]/)[0]
  try {
    p = decodeURI(p)
  } catch (e) {}
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

/** 每種語言都有的列表頁，可以直接互相對應 */
export const SHARED_LOCALE_PATHS = ['/', '/archive', '/category', '/tag', '/search']

/**
 * 計算目前頁面在各語言的對應路徑
 * @param {string} asPath 目前路徑（不含語言前綴）
 * @param {Object} localePaths { 'zh-TW': ['/article/a', ...], en: [...] }
 * @returns {Object} { 'zh-TW': '/article/a', en: '/article/a' }，沒有對應版本的語言不會出現
 */
export function getLocaleAlternates(asPath, localePaths) {
  if (!localePaths) return {}
  const path = normalizeLocalePath(asPath)
  const result = {}
  Object.keys(localePaths).forEach(locale => {
    if (SHARED_LOCALE_PATHS.includes(path) || localePaths[locale]?.includes(path)) {
      result[locale] = path
    }
  })
  return result
}

/** 語言前綴，預設語言為空 */
export function getLocalePrefix(locale) {
  return !locale || locale === BLOG.LANG ? '' : '/' + locale
}
