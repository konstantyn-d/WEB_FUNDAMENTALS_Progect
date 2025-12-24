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

module.exports = router