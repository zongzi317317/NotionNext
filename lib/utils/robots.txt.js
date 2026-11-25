import fs from 'fs'

/**
 * 明确放行的 AI / 搜索爬虫。
 * 默认规则 `User-agent: *` 已经允许抓取，这里逐个列出，
 * 是为了让 AI 搜索引擎（GEO）看到明确的放行声明。
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'Meta-ExternalAgent',
  'Bytespider',
  'DuckAssistBot',
  'MistralAI-User'
]

export function buildRobotsTxt(link) {
  const base = String(link || '').replace(/\/+$/, '')
  const lines = ['# Allow all crawlers', 'User-agent: *', 'Allow: /', '']

  lines.push('# AI search and assistant crawlers are welcome')
  AI_CRAWLERS.forEach(agent => lines.push(`User-agent: ${agent}`))
  lines.push('Allow: /', '')

  if (base) {
    lines.push(`Sitemap: ${base}/sitemap.xml`, '')
    lines.push(`# LLM-friendly site summary: ${base}/llms.txt`, '')
  }

  return lines.join('\n')
}

export function generateRobotsTxt(props) {
  const { siteInfo } = props
  const content = buildRobotsTxt(siteInfo?.link)
  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('./public/robots.txt', content)
  } catch (error) {
    // 在vercel运行环境是只读的，这里会报错；
    // 但在vercel编译阶段、或VPS等其他平台这行代码会成功执行
  }
}
