/**
 * @jest-environment node
 */
import BLOG from '@/blog.config'

jest.mock('@/lib/config', () => ({
  siteConfig: key => ({ IMAGE_COMPRESS_WIDTH: 1080 })[key]
}))

// eslint-disable-next-line import/first
import { compressImage, mapImgUrl } from '@/lib/db/notion/mapImage'

const original = {
  LINK: BLOG.LINK,
  NOTION_HOST: BLOG.NOTION_HOST,
  NOTION_IMAGE_PROXY: BLOG.NOTION_IMAGE_PROXY,
  RANDOM_IMAGE_URL: BLOG.RANDOM_IMAGE_URL
}

describe('mapImgUrl 大陆可访问的图片中转', () => {
  beforeEach(() => {
    BLOG.LINK = 'https://krclinicdaily.com'
    BLOG.NOTION_HOST = 'https://www.notion.so'
    BLOG.NOTION_IMAGE_PROXY = ''
    BLOG.RANDOM_IMAGE_URL = ''
  })
  afterEach(() => Object.assign(BLOG, original))

  const block = { type: 'image', id: 'b1' }

  it('外链图片改走本站 /api/notion-image/image/ 中转，而不是 www.notion.so', () => {
    const src = 'https://cdn.imweb.me/thumbnail/20260722/a.jpg'
    const ret = mapImgUrl(src, block, 'block', false)
    expect(ret.startsWith('https://krclinicdaily.com/api/notion-image/image/')).toBe(true)
    expect(ret).toContain(encodeURIComponent(src))
    expect(ret).toContain('table=block')
    expect(ret).toContain('id=b1')
    expect(ret).not.toContain('www.notion.so')
  })

  it('Notion 附件图片同样中转', () => {
    const ret = mapImgUrl('attachment:abc:x.png', block, 'block', false)
    expect(ret.startsWith('https://krclinicdaily.com/api/notion-image/image/attachment')).toBe(true)
  })

  it('Notion 自带封面（相对路径）也中转', () => {
    const ret = mapImgUrl('/images/page-cover/solid_blue.png', block, 'block', false)
    expect(ret.startsWith('https://krclinicdaily.com/api/notion-image/images/page-cover/')).toBe(true)
  })

  it('本站自己的图片（含 www）直接加载，不绕道 Notion', () => {
    for (const src of [
      'https://krclinicdaily.com/images/covers/a.webp',
      'https://www.krclinicdaily.com/images/covers/a.webp'
    ]) {
      const ret = mapImgUrl(src, block, 'block', false)
      expect(ret.startsWith(src)).toBe(true)
      expect(ret).not.toContain('/api/notion-image')
    }
  })

  it('已是中转地址时不会二次包装', () => {
    const once = mapImgUrl('https://a.com/x.jpg', block, 'block', false)
    expect(mapImgUrl(once, block, 'block', false).match(/notion-image/g)).toHaveLength(1)
  })

  it('NOTION_IMAGE_PROXY=off 时保持原来的 www.notion.so/image', () => {
    BLOG.NOTION_IMAGE_PROXY = 'off'
    const ret = mapImgUrl('https://a.com/x.jpg', block, 'block', false)
    expect(ret.startsWith('https://www.notion.so/image/')).toBe(true)
  })

  it('点击放大时 compressImage 仍能调整中转地址里的 unsplash 尺寸', () => {
    const ret = mapImgUrl('https://images.unsplash.com/photo-1?w=400', block, 'block', false)
    const hd = compressImage(ret, 1920)
    expect(hd.startsWith('https://krclinicdaily.com/api/notion-image/image/')).toBe(true)
    expect(decodeURIComponent(hd)).toContain('width=1920')
  })
})
