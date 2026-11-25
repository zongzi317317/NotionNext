import BLOG from '@/blog.config'
import {
  getAllContentLocales,
  getLocaleAlternates,
  isContentLocalesEnabled
} from '@/lib/utils/contentLocale'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * 語言切換（同庫多語言，見 conf/i18n.config.js）
 * 目前頁面有對應語言版本時切到對應頁面，沒有則切到該語言首頁
 */
export default function LangSwitch({ localePaths, className = '' }) {
  const router = useRouter()
  if (!isContentLocalesEnabled()) return null

  const current = router?.locale || BLOG.LANG
  const alternates = getLocaleAlternates(router?.asPath, localePaths)
  const labels = BLOG.CONTENT_LOCALE_LABELS || {}
  const others = getAllContentLocales().filter(l => l !== current)
  if (others.length === 0) return null

  return (
    <div className={`flex items-center ${className}`}>
      {others.map(loc => (
        <Link
          key={loc}
          href={alternates[loc] || '/'}
          locale={loc}
          hrefLang={loc}
          title={labels[loc] || loc}
          className='text-sm font-semibold px-2 h-8 flex justify-center items-center rounded-full hover:bg-black hover:bg-opacity-10 duration-200 transition-all whitespace-nowrap'>
          <i className='fa-solid fa-globe mr-1' />
          {labels[loc] || loc}
        </Link>
      ))}
    </div>
  )
}
