import { buildFaqStructuredData, extractFaqFromPost } from '@/lib/seo/faq'

const t = text => ({ properties: { title: [[text]] } })

const makePost = blocks => {
  const block = {}
  const content = []
  blocks.forEach(([id, type, text, children], index) => {
    const blockId = id || `b${index}`
    block[blockId] = {
      value: {
        id: blockId,
        type,
        ...t(text),
        ...(children ? { content: children } : {})
      }
    }
    if (!id || !id.startsWith('child')) content.push(blockId)
  })
  return { id: 'post', content, blockMap: { block } }
}

describe('extractFaqFromPost', () => {
  it('reads heading questions under an FAQ heading', () => {
    const post = makePost([
      [null, 'sub_header', '肉毒桿菌是什麼？'],
      [null, 'text', '正文，不屬於 FAQ。'],
      [null, 'sub_header', '關於弘大肉毒的常見問題（FAQ）'],
      [null, 'sub_sub_header', 'Q. 肉毒和填充劑是同一種療程嗎？'],
      [null, 'text', '不是。'],
      [null, 'text', '兩者的目的不同。'],
      [null, 'sub_sub_header', 'Q. 肉毒的效果是永久的嗎？'],
      [null, 'text', '不是永久的。'],
      [null, 'divider', ''],
      [null, 'text', '原文連結']
    ])

    expect(extractFaqFromPost(post)).toEqual([
      {
        question: '肉毒和填充劑是同一種療程嗎？',
        answer: '不是。兩者的目的不同。'
      },
      { question: '肉毒的效果是永久的嗎？', answer: '不是永久的。' }
    ])
  })

  it('reads bold paragraph questions and stops at the next section', () => {
    const post = makePost([
      [null, 'header', '常見問題'],
      [null, 'text', 'Q1：費用大概多少？'],
      [null, 'text', '以活動價為例：'],
      [null, 'bulleted_list', '熱瑪吉約 1,290,000 韓元'],
      [null, 'text', '另加 10% 增值稅。[1]'],
      [null, 'text', 'Q2：看診時有中文翻譯嗎？'],
      [null, 'text', '有。'],
      [null, 'header', '參考資料'],
      [null, 'text', '不應該被收進答案']
    ])

    expect(extractFaqFromPost(post)).toEqual([
      {
        question: '費用大概多少？',
        answer: '以活動價為例：熱瑪吉約 1,290,000 韓元；另加 10% 增值稅。'
      },
      { question: '看診時有中文翻譯嗎？', answer: '有。' }
    ])
  })

  it('reads toggle blocks as question and answer', () => {
    const post = makePost([
      [null, 'sub_header', 'FAQ'],
      [null, 'toggle', '可以當天做嗎？', ['child1']],
      ['child1', 'text', '要看醫師評估。']
    ])

    expect(extractFaqFromPost(post)).toEqual([
      { question: '可以當天做嗎？', answer: '要看醫師評估。' }
    ])
  })

  it('returns nothing when there is no FAQ section', () => {
    const post = makePost([
      [null, 'sub_header', '肉毒桿菌是什麼？'],
      [null, 'text', '說明']
    ])
    expect(extractFaqFromPost(post)).toEqual([])
    expect(extractFaqFromPost(undefined)).toEqual([])
  })
})

describe('buildFaqStructuredData', () => {
  it('builds FAQPage data', () => {
    const data = buildFaqStructuredData(
      [{ question: 'Q?', answer: 'A.' }],
      'https://example.com/article/a'
    )
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://example.com/article/a#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q?',
          acceptedAnswer: { '@type': 'Answer', text: 'A.' }
        }
      ]
    })
    expect(buildFaqStructuredData([], 'x')).toBeNull()
  })
})
