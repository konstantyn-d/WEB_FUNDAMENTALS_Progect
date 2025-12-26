const express = require('express')
const supabase = require('../config/supabase')
const openai = require('../config/openai')

const router = express.Router()

const SKIN_ANALYSIS_PROMPT = `
You are a skincare analysis assistant. Analyze the provided face photo and describe ONLY what is visually observable.
Do NOT diagnose medical conditions and do NOT claim to be a doctor/dermatologist.
If something could be medical or uncertain, label it as "possible" and recommend consulting a dermatologist.

Focus on visible features such as:
- dryness/dehydration signs (flaking, dullness)
- oiliness/shine, enlarged pores
- redness/irritation appearance
- uneven tone, hyperpigmentation-looking spots
- acne-like blemishes, comedone-like bumps
- texture irregularities, fine lines
- under-eye darkness/puffiness appearance

Return JSON ONLY in this exact format:
{
  "issues": [
    {
      "name": "short observable issue name",
      "severity": "mild|moderate|severe",
      "location": "face area",
      "description": "what you see in the photo (no diagnosis words)",
      "confidence": 0.8
    }
  ],
  "recommendations": [
    "skincare recommendation 1",
    "skincare recommendation 2",
    "skincare recommendation 3"
  ],
  "overallAssessment": "short summary based on visible features",
  "skinType": "oily|dry|combination|normal",
  "whenToSeeDermatologist": ["concern 1 if any"]
}

Rules:
- Use ONLY the allowed enums for severity and skinType.
- If skin looks healthy, return an empty issues array and positive overallAssessment.
- Respond with JSON only. No extra text, no markdown.
`

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a cosmetic skincare advisor (NOT a doctor). You observe visible skin features in photos and provide general skincare tips. You never diagnose medical conditions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: SKIN_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.4
    })

    const content = response.choices[0].message.content
    console.log('OpenAI response:', content)

    let analysis
    try {
      // Try to extract JSON from the response
      // Remove markdown code blocks if present
      let cleanContent = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim()
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        console.log('Parsed analysis successfully')
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      console.error('Parse error:', parseError.message)
      
      // Check if OpenAI refused the request
      if (content.toLowerCase().includes('cannot') || 
          content.toLowerCase().includes("can't") ||
          content.toLowerCase().includes('unable') ||
          content.toLowerCase().includes('sorry')) {
        analysis = {
          issues: [],
          recommendations: [
            'Please ensure good lighting',
            'Position your face clearly in the frame',
            'Try again with a clearer photo'
          ],
          overallAssessment: 'Could not analyze the image. Please try with a clearer photo in good lighting.',
          skinType: 'unknown'
        }
      } else {
        analysis = {
          issues: [],
          recommendations: ['Please try again with a different photo.'],
          overallAssessment: 'Analysis could not be completed. Please try again.',
          skinType: 'unknown'
        }
      }
    }

    // Save to database
    console.log('Saving scan to database for user:', user.id)
    
    const { data: scan, error: dbError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        issues: analysis.issues || [],
        recommendations: analysis.recommendations || []
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError.message, dbError.details)
    } else {
      console.log('Scan saved successfully with ID:', scan?.id)
    }

    res.json({
      success: true,
      analysis,
      scanId: scan?.id
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