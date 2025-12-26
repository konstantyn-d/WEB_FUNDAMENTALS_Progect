const express = require('express')
const supabase = require('../config/supabase')

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 6 characters'
      })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    res.status(201).json({
      message: 'Registration successful',
      user: data.user
    })

  } catch (error) {
    res.status(400).json({
      error: 'Registration Failed',
      message: error.message
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session
    })

  } catch (error) {
    res.status(401).json({
      error: 'Login Failed',
      message: error.message
    })
  }
})

router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    res.json({
      message: 'Logout successful'
    })

  } catch (error) {
    res.status(500).json({
      error: 'Logout Failed',
      message: error.message
    })
  }
})

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) throw error

    res.json({
      user
    })

  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message
    })
  }
})

// GET /api/auth/profile - Get user profile with role
router.get('/profile', async (req, res) => {
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

    console.log('Fetching profile for user:', user.id, user.email)

    // Get profile with role - use maybeSingle to handle missing profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError.message)
      return res.json({
        id: user.id,
        email: user.email,
        role: 'user'
      })
    }

    // If profile doesn't exist, create it
    if (!profile) {
      console.log('Profile not found, creating new profile for:', user.email)
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: 'admin' // Make first user admin, or change to 'user'
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create profile:', createError.message)
        return res.json({
          id: user.id,
          email: user.email,
          role: 'user'
        })
      }

      console.log('Profile created:', newProfile)
      return res.json({
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role || 'user',
        created_at: newProfile.created_at
      })
    }

    console.log('Profile found:', { id: profile.id, email: profile.email, role: profile.role })

    res.json({
      id: profile.id,
      email: profile.email,
      role: profile.role || 'user',
      created_at: profile.created_at
    })

  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    })
  }
})

module.exports = router