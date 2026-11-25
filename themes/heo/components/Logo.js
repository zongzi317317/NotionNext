import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

/**
 * 站点 Logo：图示 + 中英文站名
 * 图示路径与文字可在 themes/heo/config.js 中通过 HEO_LOGO_* 配置
 */
const Logo = () => {
  const logoImg = siteConfig('HEO_LOGO_IMG', '/images/logo/icon.svg', CONFIG)
  const titleEn = siteConfig('HEO_LOGO_TITLE_1', null, CONFIG) || siteConfig('TITLE')
  const titleZh = siteConfig('HEO_LOGO_TITLE_2', null, CONFIG)
  return (
    <SmartLink href='/' passHref legacyBehavior>
      <div className='flex flex-nowrap items-center cursor-pointer flex-none'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoImg}
          width={36}
          height={36}
          alt={titleEn}
          className='w-9 h-9 rounded-lg mr-3'
        />
        <div className='flex flex-col leading-tight'>
          <span className='font-extrabold text-base tracking-wide'>
            {titleEn}
          </span>
          {titleZh && (
            <span className='text-xs tracking-[0.3em] text-[var(--heo-color-accent)]'>
              {titleZh}
            </span>
          )}
        </div>
      </div>
    </SmartLink>
  )
}
export default Logo
