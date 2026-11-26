import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import CONFIG from '../config'

/**
 * 首頁「合作醫院」Logo 輪播
 * 純 CSS 無限橫向捲動：清單渲染兩次，整條往左移動一半寬度後無縫接回。
 * 滑鼠移入或鍵盤聚焦時暫停；系統設定「減少動態效果」時改成可手動橫向滑動。
 */
export default function PartnerClinics() {
  const { lang } = useGlobal()
  const enable = siteConfig('HEO_PARTNER_ENABLE', true, CONFIG)
  const title = siteConfig('HEO_PARTNER_TITLE', '合作醫院', CONFIG)
  const speed = Number(siteConfig('HEO_PARTNER_SPEED', 40, CONFIG)) || 40
  let clinics = siteConfig('HEO_PARTNER_CLINICS', [], CONFIG)
  if (typeof clinics === 'string') {
    try {
      clinics = JSON.parse(clinics)
    } catch (e) {
      clinics = []
    }
  }
  if (!enable || !Array.isArray(clinics) || clinics.length === 0) return null

  const isEn = String(lang || '').startsWith('en')
  const nameOf = c => (isEn ? c.nameEn || c.name : c.name || c.nameEn)

  const renderList = copy => (
    <ul
      className='partner-list flex shrink-0 gap-3 pr-3'
      aria-hidden={copy ? 'true' : undefined}>
      {clinics.map((c, i) => (
        <li key={i} className='flex w-32 shrink-0 flex-col items-center md:w-40'>
          <div className='partner-tile flex h-14 w-32 items-center justify-center rounded-lg px-3 md:h-16 md:w-40 md:px-4'>
            {c.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.logo}
                alt={copy ? '' : c.alt || nameOf(c)}
                loading='lazy'
                decoding='async'
                draggable='false'
                className='max-h-9 max-w-full object-contain md:max-h-11'
              />
            ) : (
              <span className='text-center text-sm font-semibold text-gray-800'>
                {nameOf(c)}
              </span>
            )}
          </div>
          <span className='mt-1.5 w-full truncate text-center text-xs text-[var(--heo-color-text-secondary)] dark:text-gray-400'>
            {nameOf(c)}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <section
      id='partner-clinics'
      aria-labelledby='partner-clinics-title'
      className='mb-4 overflow-hidden rounded-xl border bg-[var(--heo-color-card)] py-4 dark:border-gray-600 dark:bg-[var(--heo-color-card-dark)]'>
      <h2
        id='partner-clinics-title'
        className='mb-3 px-4 text-base font-bold md:px-5 md:text-lg text-[var(--heo-color-text)] dark:text-gray-100'>
        {title}
      </h2>
      <div className='partner-viewport relative'>
        <div
          className='partner-track flex w-max'
          style={{ animationDuration: `${speed}s` }}>
          {renderList(false)}
          {renderList(true)}
        </div>
      </div>
      <style jsx global>{`
        #partner-clinics .partner-viewport {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            #000 6%,
            #000 94%,
            transparent
          );
          mask-image: linear-gradient(
            to right,
            transparent,
            #000 6%,
            #000 94%,
            transparent
          );
        }
        /* logo 多為深色字，深淺模式都放在淺色底卡上 */
        #partner-clinics .partner-tile {
          background-color: #ffffff;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
        }
        .dark #partner-clinics .partner-tile {
          background-color: #eef1f5;
          box-shadow: none;
        }
        #partner-clinics .partner-track {
          animation-name: partner-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        #partner-clinics .partner-viewport:hover .partner-track,
        #partner-clinics .partner-viewport:focus-within .partner-track {
          animation-play-state: paused;
        }
        @keyframes partner-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          #partner-clinics .partner-viewport {
            overflow-x: auto;
          }
          #partner-clinics .partner-track {
            animation: none;
          }
          #partner-clinics .partner-list[aria-hidden] {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}
