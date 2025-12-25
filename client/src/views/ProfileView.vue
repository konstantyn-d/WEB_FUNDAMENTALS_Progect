<script setup>
import { computed } from 'vue'
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

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const formattedDate = computed(() => {
  if (!user.value?.created_at) return 'Unknown'
  return new Date(user.value.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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
</script>

<template>
  <div class="profile-page">
    <header class="profile-header">
      <button @click="goBack" class="back-btn">
        <img :src="IconArrowLeft" alt="" class="icon" />
        Back
      </button>
      <h1>Profile</h1>
      <div class="spacer"></div>
    </header>

    <main class="profile-content">
      <div class="profile-card">
        <div class="avatar">
          <img :src="IconUser" alt="" class="icon" />
        </div>
        <div class="user-info">
          <h2>{{ user?.email || 'Loading...' }}</h2>
          <p class="join-date">Member since {{ formattedDate }}</p>
        </div>
      </div>

      <section class="profile-section">
        <h3>Your Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <img :src="IconCamera" alt="" class="icon" />
            </div>
            <div class="stat-value">0</div>
            <div class="stat-label">Total Scans</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <img :src="IconSearch" alt="" class="icon" />
            </div>
            <div class="stat-value">0</div>
            <div class="stat-label">Issues Found</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <img :src="IconCalendar" alt="" class="icon" />
            </div>
            <div class="stat-value">Never</div>
            <div class="stat-label">Last Scan</div>
          </div>
        </div>
      </section>

      <section class="profile-section">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
          <button @click="goToScan" class="action-btn scan">
            <span class="btn-icon">
              <img :src="IconCamera" alt="" class="icon" />
            </span>
            <span>New Scan</span>
          </button>
          <button @click="goBack" class="action-btn dashboard">
            <span class="btn-icon">
              <img :src="IconHome" alt="" class="icon" />
            </span>
            <span>Dashboard</span>
          </button>
        </div>
      </section>

      <section class="profile-section">
        <h3>Account</h3>
        <button @click="logout" class="logout-btn">
          <img :src="IconLogout" alt="" class="icon" />
          Log Out
        </button>
      </section>
    </main>
  </div>
</template>
