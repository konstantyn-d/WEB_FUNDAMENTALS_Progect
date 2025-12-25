<script setup>
import { computed } from 'vue'
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

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

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
</script>

<template>
  <div class="dashboard">
    <nav class="navbar">
      <div class="logo">
        <img :src="IconHeartbeat" alt="" class="icon" />
        <span>Skin Analyzer</span>
      </div>
      <div class="nav-links">
        <button @click="goToScan" class="btn-scan btn-shine">
          <img :src="IconCamera" alt="" class="icon" />
          <span>Scan</span>
        </button>
        <button @click="goToProfile" class="nav-btn">
          <img :src="IconUser" alt="" class="icon" />
          Profile
        </button>
        <button @click="logout" class="nav-btn logout">
          <img :src="IconLogout" alt="" class="icon" />
          Log Out
        </button>
      </div>
    </nav>

    <main class="main-content">
      <h1>Welcome{{ user?.email ? ', ' + user.email.split('@')[0] : '' }}!</h1>
      <p class="welcome-text">Your AI-powered skin analysis dashboard</p>

      <div class="cards-grid">
        <div class="card scan-card" @click="goToScan">
          <div class="card-icon">
            <img :src="IconCamera" alt="" class="icon" />
          </div>
          <h3>New Scan</h3>
          <p>Take a photo of your face for AI skin analysis</p>
        </div>

        <div class="card">
          <div class="card-icon">
            <img :src="IconChartPie" alt="" class="icon" />
          </div>
          <h3>Statistics</h3>
          <p>Total scans: 0</p>
        </div>

        <div class="card">
          <div class="card-icon">
            <img :src="IconLightbulb" alt="" class="icon" />
          </div>
          <h3>Recommendations</h3>
          <p>Tips will appear after your first scan</p>
        </div>
      </div>

      <section class="empty-state">
        <div class="empty-icon">
          <img :src="IconSearch" alt="" class="icon" />
        </div>
        <h2>No scans yet</h2>
        <p>Start your first skin analysis to get personalized recommendations</p>
        <button @click="goToScan" class="btn btn-primary">Start Scanning</button>
      </section>
    </main>
  </div>
</template>
