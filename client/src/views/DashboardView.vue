<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import '../styles/dashboard.css'

import IconHeartbeat from '../assets/icons/heartbeat.svg'
import IconCamera from '../assets/icons/camera.svg'
import IconUser from '../assets/icons/user.svg'
import IconLogout from '../assets/icons/logout.svg'
import IconChartPie from '../assets/icons/chart-pie.svg'
import IconLightbulb from '../assets/icons/lightbulb.svg'
import IconSearch from '../assets/icons/search.svg'
import IconCalendar from '../assets/icons/calendar.svg'
import IconWarning from '../assets/icons/warning.svg'

const API_URL = 'http://localhost:3000/api'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const userName = computed(() => {
  if (!user.value?.email) return ''
  return user.value.email.split('@')[0]
})

// Data state
const stats = ref({
  totalScans: 0,
  totalIssues: 0,
  lastScan: null
})
const recentScans = ref([])
const latestRecommendations = ref([])
const isLoading = ref(true)
const error = ref('')

// Fetch dashboard data
const fetchDashboardData = async () => {
  isLoading.value = true
  error.value = ''

  try {
    // Fetch stats
    const statsResponse = await fetch(`${API_URL}/scans/stats`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      stats.value = {
        totalScans: statsData.totalScans || 0,
        totalIssues: statsData.totalIssues || 0,
        lastScan: statsData.lastScan
      }
    }

    // Fetch recent scans
    const scansResponse = await fetch(`${API_URL}/scans`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (scansResponse.ok) {
      const scansData = await scansResponse.json()
      recentScans.value = scansData.scans?.slice(0, 5) || []
      
      // Get latest recommendations from most recent scan
      if (recentScans.value.length > 0 && recentScans.value[0].recommendations) {
        latestRecommendations.value = recentScans.value[0].recommendations.slice(0, 3)
      }
    }

  } catch (err) {
    console.error('Failed to fetch dashboard data:', err)
    error.value = 'Failed to load dashboard data'
  } finally {
    isLoading.value = false
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Format full date for scan items
const formatScanDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goToScan = () => {
  router.push({ name: 'scan' })
}

const goToProfile = () => {
  router.push({ name: 'profile' })
}

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

// Load data on mount
onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="logo">
        <img :src="IconHeartbeat" alt="" class="icon" />
        <span class="logo-text">Skin Analyzer</span>
      </div>
      <div class="nav-links">
        <button @click="goToScan" class="nav-btn nav-btn-primary">
          <img :src="IconCamera" alt="" class="icon" />
          <span>New Scan</span>
        </button>
        <button @click="goToProfile" class="nav-btn">
          <img :src="IconUser" alt="" class="icon" />
          <span>Profile</span>
        </button>
        <button @click="logout" class="nav-btn nav-btn-danger">
          <img :src="IconLogout" alt="" class="icon" />
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1 class="welcome-title">Welcome back{{ userName ? ', ' + userName : '' }}</h1>
        <p class="welcome-subtitle">Your AI-powered skin analysis dashboard</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loader"></div>
        <p>Loading your data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-banner">
        <img :src="IconWarning" alt="" class="icon" />
        <span>{{ error }}</span>
        <button @click="fetchDashboardData" class="btn btn-secondary">Retry</button>
      </div>

      <!-- Dashboard Content -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="cards-grid">
          <div class="dashboard-card dashboard-card-interactive dashboard-card-highlight" @click="goToScan">
            <div class="card-icon">
              <img :src="IconCamera" alt="" class="icon" />
            </div>
            <h3 class="card-title">New Scan</h3>
            <p class="card-description">Start an AI-powered skin analysis to identify conditions and get recommendations</p>
          </div>

          <div class="dashboard-card">
            <div class="card-icon">
              <img :src="IconChartPie" alt="" class="icon" />
            </div>
            <h3 class="card-title">Statistics</h3>
            <div class="card-value">{{ stats.totalScans }}</div>
            <p class="card-label">Total Scans</p>
            <p class="card-sublabel" v-if="stats.totalIssues > 0">
              {{ stats.totalIssues }} issues detected
            </p>
          </div>

          <div class="dashboard-card">
            <div class="card-icon">
              <img :src="IconCalendar" alt="" class="icon" />
            </div>
            <h3 class="card-title">Last Scan</h3>
            <div class="card-value card-value-sm">{{ formatDate(stats.lastScan) }}</div>
            <p class="card-label">Most recent analysis</p>
          </div>
        </div>

        <!-- Has Scans: Show Recommendations and History -->
        <template v-if="stats.totalScans > 0">
          <!-- Latest Recommendations -->
          <div class="dashboard-section" v-if="latestRecommendations.length > 0">
            <div class="section-header">
              <h2 class="section-title">
                <img :src="IconLightbulb" alt="" class="icon" />
                Latest Recommendations
              </h2>
            </div>
            <div class="recommendations-grid">
              <div 
                v-for="(rec, index) in latestRecommendations" 
                :key="index"
                class="recommendation-card"
              >
                <div class="recommendation-number">{{ index + 1 }}</div>
                <p class="recommendation-text">{{ rec }}</p>
              </div>
            </div>
          </div>

          <!-- Recent Scans -->
          <div class="dashboard-section" v-if="recentScans.length > 0">
            <div class="section-header">
              <h2 class="section-title">
                <img :src="IconSearch" alt="" class="icon" />
                Recent Scans
              </h2>
            </div>
            <div class="recent-scans">
              <div 
                v-for="scan in recentScans" 
                :key="scan.id"
                class="scan-item"
              >
                <div class="scan-item-info">
                  <div class="scan-item-icon">
                    <img :src="IconCamera" alt="" class="icon" />
                  </div>
                  <div class="scan-item-details">
                    <span class="scan-item-date">{{ formatScanDate(scan.created_at) }}</span>
                    <span class="scan-item-issues">
                      {{ scan.issues?.length || 0 }} issue{{ scan.issues?.length !== 1 ? 's' : '' }} detected
                    </span>
                  </div>
                </div>
                <div class="scan-item-badge" :class="scan.issues?.length > 0 ? 'has-issues' : 'no-issues'">
                  {{ scan.issues?.length > 0 ? 'Issues Found' : 'Clear' }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State / CTA -->
        <div class="scan-cta" v-else>
          <div class="scan-cta-icon">
            <img :src="IconSearch" alt="" class="icon" />
          </div>
          <h2 class="scan-cta-title">Ready to analyze your skin?</h2>
          <p class="scan-cta-description">
            Take your first AI-powered skin scan to receive personalized insights 
            and professional recommendations for your skin health.
          </p>
          <button @click="goToScan" class="btn btn-primary btn-lg">
            <img :src="IconCamera" alt="" class="icon" />
            Start Your First Scan
          </button>
        </div>
      </template>
    </main>
  </div>
</template>
