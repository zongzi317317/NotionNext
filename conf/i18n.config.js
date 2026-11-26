/**
 * 同庫多語言（方案 A）
 * 一個 Notion 資料庫同時存放多種語言的頁面，用資料庫的 `lang` 欄位區分：
 * - lang 留空或填 LANG（預設 zh-TW）的頁面出現在根路徑 /
 * - lang 填 en 的頁面出現在 /en/ 下
 * 同一篇文章的不同語言版本使用相同的 slug，網站會自動把它們互相對應（語言切換、hreflang）。
 *
 * 注意：這和 NotionNext 原生的「NOTION_PAGE_ID=xxx,en:yyy」多資料庫方案不同，兩者不要同時使用。
 */
const CONTENT_LOCALES = (process.env.NEXT_PUBLIC_CONTENT_LOCALES ?? 'en')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

module.exports = {
  // 除預設語言 LANG 以外、與預設語言共用同一個資料庫的語言，逗號分隔，例如 'en' 或 'en,ja'
  CONTENT_LOCALES,
  // Notion 資料庫中標記語言的欄位名（Select 或 Multi-select）
  CONTENT_LANG_PROPERTY: process.env.NEXT_PUBLIC_CONTENT_LANG_PROPERTY || 'lang',
  // 語言切換按鈕上顯示的名稱
  CONTENT_LOCALE_LABELS: {
    'zh-TW': '繁中',
    en: 'EN'
  },
  // 各語言的站點配置覆蓋：在該語言頁面上取代同名配置。
  // Notion 配置表中也可以加「配置名_EN」的行（例如 HEO_HERO_TITLE_1_EN），優先級高於這裡。
  CONTENT_LOCALE_CONFIG: {
    en: {
      TITLE: 'Korea Clinic Daily',
      DESCRIPTION:
        'Independent guides to Korean dermatology and aesthetic clinics in Seoul: treatments, prices and first-visit tips.',
      BIO: 'Korean dermatology & aesthetic clinic guides',
      KEYWORDS:
        'Korea dermatology, Korean skin clinic, Seoul aesthetic clinic, Hongdae dermatology, Korea botox, Korea lifting',
      HEO_LOGO_TITLE_2: 'Seoul Skin Clinic Guide',
      HEO_NOTICE_BAR: [
        { title: 'Welcome to Korea Clinic Daily', url: '/' },
        { title: 'New Korean clinic guides every week', url: '/archive' }
      ],
      HEO_HERO_TITLE_1: 'Korean Clinics',
      HEO_HERO_TITLE_2: 'Honest guides & info',
      HEO_HERO_TITLE_4: 'Latest posts',
      HEO_HERO_TITLE_5: 'Korea Clinic Daily',
      HEO_HERO_COVER_TITLE: 'Random read',
      // 英文文章的分類請用這三個英文名稱（Notion category 欄位中的選項）
      HEO_HERO_CATEGORY_1: { title: 'Clinic Picks', url: '/category/Clinic Picks' },
      HEO_HERO_CATEGORY_2: { title: 'Aesthetics Guide', url: '/category/Aesthetics Guide' },
      HEO_HERO_CATEGORY_3: { title: 'Seoul Notes', url: '/category/Seoul Notes' },
      HEO_INFOCARD_GREETINGS: [
        'Hi! This is',
        '🏥 Korean clinic info',
        '✨ Skin & aesthetic guides',
        '🗺️ Seoul visit tips'
      ],
      HEO_INFO_CARD_TEXT3: 'Learn more',
      HEO_POST_COUNT_TITLE: 'Posts:',
      HEO_SITE_TIME_TITLE: 'Days online:',
      HEO_SITE_VISIT_TITLE: 'Visits:',
      HEO_SITE_VISITOR_TITLE: 'Visitors:'
    }
  }
}
