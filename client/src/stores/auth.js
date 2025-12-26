import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const API_URL = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userRole = ref(localStorage.getItem('userRole') || 'user')
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => userRole.value === 'admin')

  async function register(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      return { success: true, data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  async function login(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      user.value = data.user
      token.value = data.session.access_token
      localStorage.setItem('token', data.session.access_token)

      // Fetch user role after login
      await fetchUserRole()

      return { success: true }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      userRole.value = 'user'
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
    }
  }

  async function fetchUser() {
    if (!token.value) return

    isLoading.value = true

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      user.value = data.user

      // Fetch user role from profile
      await fetchUserRole()

    } catch (err) {
      user.value = null
      token.value = null
      userRole.value = 'user'
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserRole() {
    if (!token.value || !user.value) return

    try {
      // Fetch user profile to get role
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        userRole.value = data.role || 'user'
        localStorage.setItem('userRole', userRole.value)
      } else {
        userRole.value = 'user'
        localStorage.setItem('userRole', 'user')
      }
    } catch (err) {
      console.log('Role fetch error (non-critical):', err.message)
      userRole.value = 'user'
      localStorage.setItem('userRole', 'user')
    }
  }

  return {
    user,
    userRole,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    fetchUser,
    fetchUserRole
  }
})