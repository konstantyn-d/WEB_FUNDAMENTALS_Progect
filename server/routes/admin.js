const express = require('express')
const supabase = require('../config/supabase')

const router = express.Router()

const requireAdmin = async (req, res, next) => {
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Profile not found'
      })
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      })
    }

    req.user = user
    next()

  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    })
  }
}

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at')

    if (profilesError) throw profilesError

    const { data: scans, error: scansError } = await supabase
      .from('scans')
      .select('id, created_at, issues')

    if (scansError) throw scansError

    const totalUsers = profiles?.length || 0
    const totalScans = scans?.length || 0
    const totalIssues = scans?.reduce((acc, scan) => acc + (scan.issues?.length || 0), 0) || 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const usersToday = profiles?.filter(p => new Date(p.created_at) >= today).length || 0

    const scansToday = scans?.filter(s => new Date(s.created_at) >= today).length || 0

    res.json({
      totalUsers,
      totalScans,
      totalIssues,
      usersToday,
      scansToday,
      avgScansPerUser: totalUsers > 0 ? (totalScans / totalUsers).toFixed(1) : 0
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    })
  }
})

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const { data: scans } = await supabase
          .from('scans')
          .select('id')
          .eq('user_id', profile.id)

        return {
          ...profile,
          scanCount: scans?.length || 0
        }
      })
    )

    res.json({ users: usersWithStats })

  } catch (error) {
    console.error('Admin users error:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    })
  }
})

router.get('/scans', requireAdmin, async (req, res) => {
  try {
    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const scansWithUsers = await Promise.all(
      scans.map(async (scan) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', scan.user_id)
          .single()

        return {
          ...scan,
          userEmail: profile?.email || 'Unknown'
        }
      })
    )

    res.json({ scans: scansWithUsers })

  } catch (error) {
    console.error('Admin scans error:', error)
    res.status(500).json({
      error: 'Failed to fetch scans',
      message: error.message
    })
  }
})

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete your own account'
      })
    }

    const { error: scansError } = await supabase
      .from('scans')
      .delete()
      .eq('user_id', id)

    if (scansError) {
      console.error('Error deleting user scans:', scansError)
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) throw profileError

    res.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Admin delete user error:', error)
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    })
  }
})

router.delete('/scans/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('scans')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    })

  } catch (error) {
    console.error('Admin delete scan error:', error)
    res.status(500).json({
      error: 'Failed to delete scan',
      message: error.message
    })
  }
})

router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid role. Must be "user" or "admin"'
      })
    }

    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot change your own role'
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Role updated successfully',
      user: data
    })

  } catch (error) {
    console.error('Admin update role error:', error)
    res.status(500).json({
      error: 'Failed to update role',
      message: error.message
    })
  }
})

module.exports = router
