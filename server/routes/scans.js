const express = require('express')
const supabase = require('../config/supabase')
const openai = require('../config/openai')

const router = express.Router()

const SKIN_ANALYSIS_PROMPT = `You are a professional dermatologist AI assistant. Analyze this face photo and identify any visible skin issues or conditions.

For each issue found, provide:
1. Name of the condition
2. Severity (mild, moderate, severe)
3. Location on face
4. Brief description

Also provide general skincare recommendations based on what you see.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "issues": [
    {
      "name": "Issue name",
      "severity": "mild|moderate|severe",
      "location": "Where on face",
      "description": "Brief description"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "overallAssessment": "Brief overall skin health assessment",
  "skinType": "oily|dry|combination|normal"
}

If no issues are found, return empty issues array with positive assessment.
Be professional but accessible. Do not diagnose serious conditions - recommend seeing a dermatologist for concerning issues.`

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
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
      max_tokens: 1000
    })

    const content = response.choices[0].message.content

    let analysis
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      analysis = {
        issues: [],
        recommendations: ['Unable to parse analysis. Please try again.'],
        overallAssessment: 'Analysis could not be completed',
        skinType: 'unknown'
      }
    }

    const { data: scan, error: dbError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        issues: analysis.issues,
        recommendations: analysis.recommendations
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
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

    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ scans })

  } catch (error) {
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

    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    const totalScans = scans.length
    const totalIssues = scans.reduce((acc, scan) => {
      return acc + (scan.issues?.length || 0)
    }, 0)
    const lastScan = scans.length > 0 ? scans[0].created_at : null

    res.json({
      totalScans,
      totalIssues,
      lastScan
    })

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    })
  }
})

module.exports = router