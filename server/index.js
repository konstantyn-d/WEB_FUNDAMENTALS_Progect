const express = require('express')
const cors = require('cors')
require('dotenv').config()

const supabase = require('./config/supabase')
const authRoutes = require('./routes/auth')
const scansRoutes = require('./routes/scans')
const adminRoutes = require('./routes/admin')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`)
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Hello from Skin Analyzer API!',
    version: '1.0.0'
  })
})

app.get('/api/db-test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('count')
    
    if (error) throw error
    
    res.json({ 
      status: 'ok',
      message: 'Database connection successful!',
      data 
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/scans', scansRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.path} does not exist`
  })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})