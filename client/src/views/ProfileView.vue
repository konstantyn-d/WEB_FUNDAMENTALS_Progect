<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import '../styles/profile.css'

import IconArrowLeft from '../assets/icons/arrow-left.svg'
import IconUser from '../assets/icons/user.svg'
import IconCamera from '../assets/icons/camera.svg'
import IconSearch from '../assets/icons/search.svg'
import IconCalendar from '../assets/icons/calendar.svg'
import IconHome from '../assets/icons/home.svg'
import IconLogout from '../assets/icons/logout.svg'
import IconChartPie from '../assets/icons/chart-pie.svg'

const API_URL = 'http://localhost:3000/api'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const userName = computed(() => {
  if (!user.value?.email) return 'User'
  return user.value.email.split('@')[0]
})

const formattedDate = computed(() => {
  if (!user.value?.created_at) return 'Unknown'
  return new Date(user.value.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Stats state
const stats = ref({
  totalScans: 0,
  totalIssues: 0,
  lastScan: null,
  skinType: null
})
const isLoading = ref(true)

// Fetch stats
const fetchStats = async () => {
  isLoading.value = true
  
  try {
    // Fetch stats
    const statsResponse = await fetch(`${API_URL}/scans/stats`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      stats.value.totalScans = statsData.totalScans || 0
      stats.value.totalIssues = statsData.totalIssues || 0
      stats.value.lastScan = statsData.lastScan
    }

    // Get skin type from last scan
    const scansResponse = await fetch(`${API_URL}/scans`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (scansResponse.ok) {
      const scansData = await scansResponse.json()
      if (scansData.scans?.length > 0) {
        // Note: skin type isn't stored in DB currently, but would be here
        stats.value.skinType = scansData.scans[0].skin_type || null
      }
    }

  } catch (err) {
    console.error('Failed to fetch stats:', err)
  } finally {
    isLoading.value = false
  }
}

// Format last scan date
const formatLastScan = computed(() => {
  if (!stats.value.lastScan) return 'Never'
  const date = new Date(stats.value.lastScan)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
})

const goBack = () => {
  router.push({ name: 'dashboard' })
}

const goToScan = () => {
  router.push({ name: 'scan' })
}

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="profile-page">
    <!-- Header -->
    <header class="profile-header">
      <div class="profile-header-inner">
        <nav class="profile-nav">
          <button @click="goBack" class="back-btn">
            <img :src="IconArrowLeft" alt="" class="icon" />
            <span>Back</span>
          </button>
        </nav>

        <div class="profile-user">
          <div class="profile-avatar">
            <img :src="IconUser" alt="" class="icon" />
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ userName }}</h1>
            <p class="profile-email">{{ user?.email || 'Loading...' }}</p>
            <div class="profile-meta">
              <div class="profile-meta-item">
                <img :src="IconCalendar" alt="" class="icon" />
                <span>Joined {{ formattedDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="profile-content">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-icon">
            <img :src="IconCamera" alt="" class="icon" />
          </div>
          <div class="stat-card-value">{{ isLoading ? '-' : stats.totalScans }}</div>
          <div class="stat-card-label">Total Scans</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">
            <img :src="IconSearch" alt="" class="icon" />
          </div>
          <div class="stat-card-value">{{ isLoading ? '-' : stats.totalIssues }}</div>
          <div class="stat-card-label">Issues Found</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">
            <img :src="IconChartPie" alt="" class="icon" />
          </div>
          <div class="stat-card-value">{{ stats.skinType || '-' }}</div>
          <div class="stat-card-label">Skin Type</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">
            <img :src="IconCalendar" alt="" class="icon" />
          </div>
          <div class="stat-card-value">{{ isLoading ? '-' : formatLastScan }}</div>
          <div class="stat-card-label">Last Scan</div>
        </div>
      </div>

      <!-- Account Section -->
      <div class="profile-section">
        <div class="section-header">
          <h2 class="section-title">Account Information</h2>
        </div>
        <div class="section-body">
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user?.email || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Member Since</span>
              <span class="info-value">{{ formattedDate }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Status</span>
              <span class="info-value">Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn" @click="goToScan">
          <div class="quick-action-icon">
            <img :src="IconCamera" alt="" class="icon" />
          </div>
          <span class="quick-action-label">New Scan</span>
        </button>
        <button class="quick-action-btn" @click="goBack">
          <div class="quick-action-icon">
            <img :src="IconHome" alt="" class="icon" />
          </div>
          <span class="quick-action-label">Dashboard</span>
        </button>
        <button class="quick-action-btn danger" @click="logout">
          <div class="quick-action-icon">
            <img :src="IconLogout" alt="" class="icon" />
          </div>
          <span class="quick-action-label">Log Out</span>
        </button>
      </div>
    </main>
  </div>
</template>
