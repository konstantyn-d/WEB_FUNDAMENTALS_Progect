const express = require('express')
const supabase = require('../config/supabase')
const openai = require('../config/openai')

const router = express.Router()

// System prompt - БЕЗ медицинских слов!
const SYSTEM_PROMPT = `
You are a skincare & beauty routine assistant.
You provide non-medical, cosmetic observations based only on what is visible in the photo.
Do not diagnose diseases or mention medical conditions.
If you cannot reliably see details, return an empty concerns array and a basic gentle routine.
If the person appears to be under 18, return empty concerns and basic routine.
Output valid JSON only.
`.trim()

// User prompt - задача
const USER_PROMPT = `
From the visible appearance in the photo, list cosmetic skincare concerns (e.g., shine, dryness-looking areas, visible redness, uneven tone-looking areas, visible pores, blemish-like spots).
Then propose a gentle routine.

Return JSON ONLY:
{
  "concerns": [{"name":"...","area":"...","description":"...","confidence":0.0}],
  "routine":{"morning":["..."],"evening":["..."]},
  "ingredientsToConsider":["..."],
  "avoidIfSensitive":["..."],
  "overallSummary":"..."
}

Rules:
- confidence 0.0–1.0
- If details are unclear or skin looks fine: concerns=[]
- JSON only
`.trim()

// Fallback при отказе
const FALLBACK_RESPONSE = {
  concerns: [],
  routine: {
    morning: ["gentle cleanser", "moisturizer", "SPF 30+"],
    evening: ["gentle cleanser", "moisturizer"]
  },
  ingredientsToConsider: ["niacinamide", "ceramides", "hyaluronic acid"],
  avoidIfSensitive: ["fragrance", "harsh scrubs", "alcohol"],
  overallSummary: "Could not assess photo details reliably. Here is a safe basic routine."
}

// Проверка на отказ модели
function isRefusal(content) {
  if (!content) return true
  const lower = content.toLowerCase()
  const refusalPhrases = [
    "i can't assist",
    "i cannot assist",
    "i'm unable",
    "i am unable",
    "sorry",
    "i can't analyze",
    "i cannot analyze",
    "i'm not able",
    "i am not able",
    "cannot provide",
    "can't provide",
    "unable to",
    "not appropriate",
    "against my guidelines"
  ]
  return refusalPhrases.some(phrase => lower.includes(phrase))
}

// Конвертация нового формата в старый для совместимости с фронтендом
function convertToLegacyFormat(analysis) {
  return {
    issues: (analysis.concerns || []).map(concern => ({
      name: concern.name,
      severity: 'mild',
      location: concern.area,
      description: concern.description,
      confidence: concern.confidence
    })),
    recommendations: [
      ...(analysis.routine?.morning || []).map(s => `Morning: ${s}`),
      ...(analysis.routine?.evening || []).map(s => `Evening: ${s}`),
      ...(analysis.ingredientsToConsider || []).map(i => `Consider: ${i}`)
    ],
    overallAssessment: analysis.overallSummary || '',
    skinType: 'unknown',
    routine: analysis.routine,
    ingredientsToConsider: analysis.ingredientsToConsider,
    avoidIfSensitive: analysis.avoidIfSensitive
  }
}

router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      })
    }

    if (!image) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Image is required'
      })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      })
    }

    console.log('Analyzing skin for user:', user.email)
    console.log('Image data length:', image?.length || 0)
    
    // ДИАГНОСТИКА: проверяем формат изображения
    console.log('Image starts with:', image?.slice(0, 50))

    // ИСПРАВЛЕНИЕ: гарантируем правильный формат data URL
    const imgUrl = image.startsWith('data:image/')
      ? image
      : `data:image/jpeg;base64,${image}`
    
    console.log('Image URL format:', imgUrl.slice(0, 30))

    // Запрос к OpenAI с response_format для железобетонного JSON
    let response
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: imgUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.3
      })
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError.message)
      throw new Error('AI service temporarily unavailable')
    }

    // ПРАВИЛЬНОЕ чтение ответа: content + refusal + finish_reason
    const choice = response?.choices?.[0]
    const msg = choice?.message
    
    const content = msg?.content ?? null
    const refusal = msg?.refusal ?? null
    const finish = choice?.finish_reason
    
    // Диагностика
    console.log('finish_reason:', finish)
    console.log('has_content:', content !== null && content !== undefined)
    console.log('has_refusal:', refusal !== null && refusal !== undefined)
    if (refusal) console.log('refusal:', refusal)
    if (content) console.log('content preview:', content.substring(0, 300))
    
    // Используем content или refusal
    const rawText = content ?? refusal ?? ''

    let analysis = null
    let status = 'completed'

    // Проверяем на отказ: content_filter, refusal поле, или текст отказа
    if (finish === 'content_filter' || refusal || isRefusal(rawText)) {
      console.log('OpenAI refused to analyze, reason:', finish === 'content_filter' ? 'content_filter' : refusal ? 'refusal field' : 'text refusal')
      analysis = FALLBACK_RESPONSE
      status = 'fallback'
    } else if (!rawText) {
      console.log('Empty response from OpenAI')
      analysis = FALLBACK_RESPONSE
      status = 'empty_response'
    } else {
      // Пробуем распарсить JSON
      try {
        analysis = JSON.parse(rawText)
        console.log('Parsed analysis successfully')
      } catch (parseError) {
        console.log('Failed to parse JSON:', parseError.message)
        analysis = FALLBACK_RESPONSE
        status = 'parse_error'
      }
    }

    // Конвертируем в legacy формат для фронтенда
    const legacyAnalysis = convertToLegacyFormat(analysis)

    // Сохраняем только если есть валидный результат
    let scanId = null
    
    if (status === 'completed') {
      console.log('Saving scan to database for user:', user.id)
      
      const { data: scan, error: dbError } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          issues: legacyAnalysis.issues || [],
          recommendations: legacyAnalysis.recommendations || []
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError.message, dbError.details)
      } else {
        console.log('Scan saved successfully with ID:', scan?.id)
        scanId = scan?.id
      }
    } else {
      console.log('Skipping database save due to status:', status)
    }

    res.json({
      success: true,
      analysis: legacyAnalysis,
      rawAnalysis: analysis,
      scanId,
      status
    })

  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({
      error: 'Analysis Failed',
      message: error.message
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      })
    }

    console.log('Fetching scans for user:', user.id)
    
    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Scans fetch error:', error.message, error.code, error.details)
      throw error
    }

    console.log('Found scans:', scans?.length || 0)
    res.json({ scans: scans || [] })

  } catch (error) {
    console.error('Scans route error:', error.message)
    res.status(500).json({
      error: 'Failed to fetch scans',
      message: error.message
    })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      })
    }

    // Get all scans ordered by date
    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Stats fetch error:', error)
      throw error
    }

    const totalScans = scans?.length || 0
    const totalIssues = scans?.reduce((acc, scan) => {
      return acc + (scan.issues?.length || 0)
    }, 0) || 0
    const lastScan = scans?.length > 0 ? scans[0].created_at : null

    console.log('Stats:', { totalScans, totalIssues, lastScan })

    res.json({
      totalScans,
      totalIssues,
      lastScan
    })

  } catch (error) {
    console.error('Stats error:', error.message)
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    })
  }
})

module.exports = router
