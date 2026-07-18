import https from 'https'

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export interface GeminiMessage {
  role: 'user' | 'model'
  content: string
}

function sanitizeHistory(history: GeminiMessage[]): GeminiMessage[] {
  const result: GeminiMessage[] = []
  for (const msg of history) {
    if (result.length === 0) {
      if (msg.role === 'user') result.push(msg)
      continue
    }
    if (msg.role !== result[result.length - 1].role) {
      result.push(msg)
    }
  }
  if (result.length > 0 && result[result.length - 1].role === 'user') {
    result.pop()
  }
  return result
}

function httpsPost(url: string, body: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }
    const req = https.request(options, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Gemini API lỗi ${res.statusCode}: ${raw}`))
        } else {
          resolve(raw)
        }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

export async function geminiChat(
  systemPrompt: string,
  history: GeminiMessage[],
  userMessage: string
): Promise<string> {
  if (!GEMINI_KEY) throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env')

  const clean = sanitizeHistory(history)
  const contents = [
    ...clean.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ]

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`

  const raw = await httpsPost(url, {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  })

  const json = JSON.parse(raw) as {
    candidates?: { content: { parts: { text: string }[] } }[]
    promptFeedback?: { blockReason?: string }
  }

  if (json.promptFeedback?.blockReason) throw new Error(`Bị chặn: ${json.promptFeedback.blockReason}`)

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini không trả về nội dung')

  return text.trim()
}