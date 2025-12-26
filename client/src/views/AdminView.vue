<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import '../styles/admin.css'

import IconHeartbeat from '../assets/icons/heartbeat.svg'
import IconUser from '../assets/icons/user.svg'
import IconCamera from '../assets/icons/camera.svg'
import IconChartPie from '../assets/icons/chart-pie.svg'
import IconSearch from '../assets/icons/search.svg'
import IconHome from '../assets/icons/home.svg'
import IconLogout from '../assets/icons/logout.svg'
import IconWarning from '../assets/icons/warning.svg'
import IconCheck from '../assets/icons/check.svg'

const API_URL = 'http://localhost:3000/api'

const router = useRouter()
const authStore = useAuthStore()

// State
const activeTab = ref('overview')
const isLoading = ref(true)
const error = ref('')
const successMessage = ref('')

// Data
const stats = ref({
  totalUsers: 0,
  totalScans: 0,
  totalIssues: 0,
  usersToday: 0,
  scansToday: 0,
  avgScansPerUser: 0
})
const users = ref([])
const scans = ref([])

// Computed
const user = computed(() => authStore.user)

// Fetch admin stats
const fetchStats = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      if (response.status === 403) {
        error.value = 'Access denied. Admin privileges required.'
        return
      }
      throw new Error('Failed to fetch stats')
    }

    stats.value = await response.json()
  } catch (err) {
    console.error('Stats error:', err)
  }
}

// Fetch all users
const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) throw new Error('Failed to fetch users')

    const data = await response.json()
    users.value = data.users || []
  } catch (err) {
    console.error('Users error:', err)
    error.value = 'Failed to load users'
  }
}

// Fetch all scans
const fetchScans = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/scans`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) throw new Error('Failed to fetch scans')

    const data = await response.json()
    scans.value = data.scans || []
  } catch (err) {
    console.error('Scans error:', err)
    error.value = 'Failed to load scans'
  }
}

// Delete user
const deleteUser = async (userId, email) => {
  if (!confirm(`Are you sure you want to delete user "${email}"? This will also delete all their scans.`)) {
    return
  }

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Failed to delete user')
    }

    successMessage.value = `User "${email}" deleted successfully`
    await fetchUsers()
    await fetchStats()

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err) {
    error.value = err.message
    setTimeout(() => {
      error.value = ''
    }, 3000)
  }
}

// Delete scan
const deleteScan = async (scanId) => {
  if (!confirm('Are you sure you want to delete this scan?')) {
    return
  }

  try {
    const response = await fetch(`${API_URL}/admin/scans/${scanId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Failed to delete scan')
    }

    successMessage.value = 'Scan deleted successfully'
    await fetchScans()
    await fetchStats()

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err) {
    error.value = err.message
    setTimeout(() => {
      error.value = ''
    }, 3000)
  }
}

// Toggle user role
const toggleUserRole = async (userId, currentRole) => {
  const newRole = currentRole === 'admin' ? 'user' : 'admin'
  
  if (!confirm(`Change user role to "${newRole}"?`)) {
    return
  }

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Failed to update role')
    }

    successMessage.value = `Role updated to "${newRole}"`
    await fetchUsers()

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err) {
    error.value = err.message
    setTimeout(() => {
      error.value = ''
    }, 3000)
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Navigation
const goToDashboard = () => {
  router.push({ name: 'dashboard' })
}

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

// Switch tabs
const switchTab = async (tab) => {
  activeTab.value = tab
  error.value = ''
  
  if (tab === 'users' && users.value.length === 0) {
    await fetchUsers()
  } else if (tab === 'scans' && scans.value.length === 0) {
    await fetchScans()
  }
}

// Load data on mount
onMounted(async () => {
  isLoading.value = true
  await fetchStats()
  isLoading.value = false
})
</script>

<template>
  <div class="admin-page">
    <!-- Header -->
    <header class="admin-header">
      <div class="admin-header-inner">
        <div class="admin-logo">
          <img :src="IconHeartbeat" alt="" class="icon" />
          <span>Admin Panel</span>
        </div>
        <div class="admin-nav">
          <button @click="goToDashboard" class="admin-nav-btn">
            <img :src="IconHome" alt="" class="icon" />
            <span>Dashboard</span>
          </button>
          <button @click="logout" class="admin-nav-btn danger">
            <img :src="IconLogout" alt="" class="icon" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="admin-content">
      <!-- Messages -->
      <div v-if="error" class="admin-message error">
        <img :src="IconWarning" alt="" class="icon" />
        <span>{{ error }}</span>
      </div>

      <div v-if="successMessage" class="admin-message success">
        <img :src="IconCheck" alt="" class="icon" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="admin-loading">
        <div class="loader"></div>
        <p>Loading admin data...</p>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div class="admin-tabs">
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'overview' }"
            @click="switchTab('overview')"
          >
            <img :src="IconChartPie" alt="" class="icon" />
            Overview
          </button>
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'users' }"
            @click="switchTab('users')"
          >
            <img :src="IconUser" alt="" class="icon" />
            Users
          </button>
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'scans' }"
            @click="switchTab('scans')"
          >
            <img :src="IconCamera" alt="" class="icon" />
            Scans
          </button>
        </div>

        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="admin-tab-content">
          <h2 class="admin-section-title">Platform Statistics</h2>
          
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="stat-icon users">
                <img :src="IconUser" alt="" class="icon" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalUsers }}</div>
                <div class="stat-label">Total Users</div>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="stat-icon scans">
                <img :src="IconCamera" alt="" class="icon" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalScans }}</div>
                <div class="stat-label">Total Scans</div>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="stat-icon issues">
                <img :src="IconSearch" alt="" class="icon" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalIssues }}</div>
                <div class="stat-label">Issues Detected</div>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="stat-icon avg">
                <img :src="IconChartPie" alt="" class="icon" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.avgScansPerUser }}</div>
                <div class="stat-label">Avg Scans/User</div>
              </div>
            </div>
          </div>

          <h3 class="admin-subsection-title">Today's Activity</h3>
          <div class="admin-today-stats">
            <div class="today-stat">
              <span class="today-value">{{ stats.usersToday }}</span>
              <span class="today-label">New Users Today</span>
            </div>
            <div class="today-stat">
              <span class="today-value">{{ stats.scansToday }}</span>
              <span class="today-label">Scans Today</span>
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="admin-tab-content">
          <h2 class="admin-section-title">All Users ({{ users.length }})</h2>
          
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Scans</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">
                        <img :src="IconUser" alt="" class="icon" />
                      </div>
                      <span>{{ u.email || 'No email' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="role-badge" :class="u.role || 'user'">
                      {{ u.role || 'user' }}
                    </span>
                  </td>
                  <td>{{ u.scanCount }}</td>
                  <td>{{ formatDate(u.created_at) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button 
                        class="action-btn role"
                        @click="toggleUserRole(u.id, u.role)"
                        :disabled="u.id === user?.id"
                        :title="u.id === user?.id ? 'Cannot change own role' : 'Toggle role'"
                      >
                        {{ u.role === 'admin' ? 'Demote' : 'Promote' }}
                      </button>
                      <button 
                        class="action-btn delete"
                        @click="deleteUser(u.id, u.email)"
                        :disabled="u.id === user?.id"
                        :title="u.id === user?.id ? 'Cannot delete yourself' : 'Delete user'"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Scans Tab -->
        <div v-if="activeTab === 'scans'" class="admin-tab-content">
          <h2 class="admin-section-title">All Scans ({{ scans.length }})</h2>
          
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Issues</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="scan in scans" :key="scan.id">
                  <td>{{ scan.userEmail }}</td>
                  <td>
                    <span class="issues-badge" :class="scan.issues?.length > 0 ? 'has-issues' : 'clear'">
                      {{ scan.issues?.length || 0 }} issue{{ scan.issues?.length !== 1 ? 's' : '' }}
                    </span>
                  </td>
                  <td>{{ formatDate(scan.created_at) }}</td>
                  <td>
                    <button 
                      class="action-btn delete"
                      @click="deleteScan(scan.id)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

