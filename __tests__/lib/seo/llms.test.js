import { buildLlmsTxt } from '@/lib/seo/llms'
import { buildRobotsTxt } from '@/lib/utils/robots.txt'

describe('buildLlmsTxt', () => {
  it('lists published posts newest first and skips drafts and external links', () => {
    const text = buildLlmsTxt({
      link: 'https://example.com/',
      siteInfo: { title: 'Example', description: 'Clinic notes' },
      author: 'G.C',
      allPages: [
        {
          type: 'Post',
          status: 'Published',
          slug: 'article/old',
          title: 'Old',
          summary: 'Old summary',
          publishDay: '2026-01-01',
          category: 'A'
        },
        {
          type: 'Post',
          status: 'Published',
          slug: 'article/new',
          title: 'New',
          summary: 'New summary',
          publishDay: '2026-11-01'
        },
        {
          type: 'Post',
          status: 'Draft',
          slug: 'article/draft',
          title: 'Draft'
        },
        { type: 'Page', status: 'Published', slug: 'about', title: 'About' },
        {
          type: 'Menu',
          status: 'Published',
          slug: 'https://other.com',
          title: 'Ext'
        }
      ]
    })

    expect(text.startsWith('# Example\n\n> Clinic notes')).toBe(true)
    expect(text).toContain(
      '- [New](https://example.com/article/new): New summary'
    )
    expect(text.indexOf('[New]')).toBeLessThan(text.indexOf('[Old]'))
    expect(text).toContain('- [About](https://example.com/about)')
    expect(text).not.toContain('Draft')
    expect(text).not.toContain('other.com')
    expect(text).toContain('https://example.com/sitemap.xml')
  })
})

describe('buildRobotsTxt', () => {
  it('allows everyone, names AI crawlers and points to the sitemap', () => {
    const text = buildRobotsTxt('https://example.com/')
    expect(text).toMatch(/^# Allow all crawlers\nUser-agent: \*\nAllow: \//)
    expect(text).toContain('User-agent: GPTBot')
    expect(text).toContain('User-agent: ClaudeBot')
    expect(text).toContain('User-agent: PerplexityBot')
    expect(text).toContain('User-agent: Google-Extended')
    expect(text).not.toMatch(/Disallow/)
    expect(text).toContain('Sitemap: https://example.com/sitemap.xml')
    expect(text.split('\n').every(line => !line.startsWith(' '))).toBe(true)
  })
})
