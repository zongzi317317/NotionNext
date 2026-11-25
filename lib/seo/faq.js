/**
 * 从 Notion 文章正文里提取 FAQ（常見問題），用于输出 FAQPage 结构化数据。
 *
 * 识别规则：
 * 1. 找到标题文字含 FAQ / 常見問題 / 常见问题 / Q&A 的 heading，作为 FAQ 区块起点；
 * 2. 区块内的问题可以是：更低一级的 heading、以 "Q" 开头或以问号结尾的短段落、toggle 块；
 * 3. 问题后面的段落、列表、引用等文字作为答案，直到下一个问题；
 * 4. 遇到同级或更高级的 heading、分隔线时 FAQ 区块结束。
 */

const HEADING_LEVELS = {
  header: 1,
  sub_header: 2,
  sub_sub_header: 3
}

const ANSWER_TYPES = new Set([
  'text',
  'bulleted_list',
  'numbered_list',
  'quote',
  'callout',
  'to_do'
])

const FAQ_TITLE_PATTERN = /(FAQ|常見問題|常见问题|Q\s*&\s*A|frequently asked)/i
const QUESTION_PREFIX_PATTERN = /^Q\s*\d*\s*[.:：、．]\s*/i
const MAX_QUESTION_LENGTH = 120
const MAX_ANSWER_LENGTH = 1200

const getHeadingLevel = type => {
  if (HEADING_LEVELS[type]) return HEADING_LEVELS[type]
  const match = /^(?:heading|header)_(\d)$/.exec(type || '')
  return match ? Number(match[1]) : 0
}

const decorationsToText = title => {
  if (!Array.isArray(title)) return typeof title === 'string' ? title : ''
  return title
    .map(item =>
      Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ''
    )
    .filter(text => text !== '‣' && text !== '⁍')
    .join('')
}

const getBlock = (blockMap, id) => {
  const record = blockMap?.block?.[id]
  // 兼容 { value: block } 与 { value: { value: block } } 两种结构
  return record?.value?.value || record?.value || null
}

const getBlockText = block => decorationsToText(block?.properties?.title).trim()

const normalizeSpace = text =>
  text
    .replace(/\s+/g, ' ')
    .replace(/([，。；：！？、）」])\s+/g, '$1')
    .trim()

// 去掉 [1]、[2] 这类引用编号
const stripCitations = text => text.replace(/\s*\[\d+\]/g, '')

const LIST_TYPES = new Set(['bulleted_list', 'numbered_list', 'to_do'])
const ENDS_WITH_PUNCTUATION = /[，。；：！？、.;:!?]$/

const cleanQuestion = text =>
  normalizeSpace(text.replace(QUESTION_PREFIX_PATTERN, ''))

const looksLikeQuestion = text => {
  if (!text) return false
  if (QUESTION_PREFIX_PATTERN.test(text) && text.length <= MAX_QUESTION_LENGTH)
    return true
  return text.length <= 80 && /[?？]$/.test(text)
}

const collectChildText = (blockMap, block, depth = 0) => {
  if (!block || depth > 3) return ''
  const parts = []
  const own = getBlockText(block)
  if (own) parts.push(own)
  if (Array.isArray(block.content)) {
    for (const childId of block.content) {
      const child = getBlock(blockMap, childId)
      if (child && ANSWER_TYPES.has(child.type)) {
        const text = collectChildText(blockMap, child, depth + 1)
        if (text) parts.push(text)
      }
    }
  }
  return parts.join(' ')
}

const truncate = rawText => {
  const text = stripCitations(rawText)
  return text.length > MAX_ANSWER_LENGTH
    ? `${text.slice(0, MAX_ANSWER_LENGTH - 1)}…`
    : text
}

export function extractFaqFromPost(post) {
  const blockMap = post?.blockMap
  if (!blockMap?.block) return []

  const rootIds =
    (Array.isArray(post?.content) && post.content.length > 0
      ? post.content
      : getBlock(blockMap, post?.id)?.content) || []

  const faqs = []
  let faqLevel = 0
  let inFaq = false
  let current = null

  const flush = () => {
    if (current?.question && current.answer.length > 0) {
      faqs.push({
        question: current.question,
        answer: truncate(
          normalizeSpace(current.answer.join(' ')).replace(/；$/, '。')
        )
      })
    }
    current = null
  }

  for (const id of rootIds) {
    const block = getBlock(blockMap, id)
    if (!block) continue
    const type = block.type
    const level = getHeadingLevel(type)
    const text = getBlockText(block)

    if (!inFaq) {
      if (level && FAQ_TITLE_PATTERN.test(text)) {
        inFaq = true
        faqLevel = level
      }
      continue
    }

    if (type === 'divider') {
      flush()
      break
    }

    if (level) {
      if (level <= faqLevel) {
        flush()
        // 后面可能还有另一个 FAQ 区块
        inFaq = FAQ_TITLE_PATTERN.test(text)
        faqLevel = level
        continue
      }
      flush()
      current = { question: cleanQuestion(text), answer: [] }
      continue
    }

    if (type === 'toggle') {
      flush()
      const question = cleanQuestion(text)
      const answer = (block.content || [])
        .map(childId => collectChildText(blockMap, getBlock(blockMap, childId)))
        .filter(Boolean)
      if (question && answer.length > 0) {
        faqs.push({
          question,
          answer: truncate(normalizeSpace(answer.join(' ')))
        })
      }
      continue
    }

    if (type === 'text' && looksLikeQuestion(text)) {
      flush()
      current = { question: cleanQuestion(text), answer: [] }
      continue
    }

    if (current && ANSWER_TYPES.has(type)) {
      let answerText = collectChildText(blockMap, block)
      if (
        answerText &&
        LIST_TYPES.has(type) &&
        !ENDS_WITH_PUNCTUATION.test(answerText)
      ) {
        answerText = `${answerText}；`
      }
      if (answerText) current.answer.push(answerText)
    }
  }
  flush()

  return faqs.filter(item => item.question && item.answer)
}

export function buildFaqStructuredData(faqs, url) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(url ? { '@id': `${url}#faq` } : {}),
    mainEntity: faqs.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  }
}
