<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import '../styles/login.css'

import IconHeartbeat from '../assets/icons/heartbeat.svg'
import IconCheck from '../assets/icons/check.svg'

const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const router = useRouter()
const authStore = useAuthStore()

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  if (!isLoginMode.value) {
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match'
      return
    }

    if (password.value.length < 6) {
      errorMessage.value = 'Password must be at least 6 characters'
      return
    }

    const result = await authStore.register(email.value, password.value)
    
    if (result.success) {
      successMessage.value = 'Registration successful! Please check your email to confirm, then sign in.'
      isLoginMode.value = true
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
    } else {
      errorMessage.value = result.error
    }

  } else {
    const result = await authStore.login(email.value, password.value)
    
    if (result.success) {
      router.push({ name: 'dashboard' })
    } else {
      errorMessage.value = result.error
    }
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Branding Panel (Desktop) -->
    <div class="login-branding">
      <div class="branding-content">
        <div class="branding-logo">
          <img :src="IconHeartbeat" alt="" class="icon" />
          <span>Skin Analyzer</span>
        </div>
        <h1 class="branding-title">AI-Powered Skin Analysis</h1>
        <p class="branding-description">
          Get professional-grade skin analysis powered by advanced AI. 
          Identify skin conditions, receive personalized recommendations, 
          and track your skin health over time.
        </p>
        <div class="branding-features">
          <div class="branding-feature">
            <img :src="IconCheck" alt="" class="icon" />
            <span>Advanced AI diagnostics</span>
          </div>
          <div class="branding-feature">
            <img :src="IconCheck" alt="" class="icon" />
            <span>Personalized recommendations</span>
          </div>
          <div class="branding-feature">
            <img :src="IconCheck" alt="" class="icon" />
            <span>Progress tracking</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Panel -->
    <div class="login-form-panel">
      <div class="login-container">
        <div class="login-header">
          <div class="login-mobile-logo">
            <img :src="IconHeartbeat" alt="" class="icon" />
            <span>Skin Analyzer</span>
          </div>
          <h1 class="login-title">{{ isLoginMode ? 'Welcome back' : 'Create account' }}</h1>
          <p class="login-subtitle">{{ isLoginMode ? 'Sign in to continue to your dashboard' : 'Start your skin health journey' }}</p>
        </div>

        <div class="login-card">
          <div class="message message-error" v-if="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="message message-success" v-if="successMessage">
            {{ successMessage }}
          </div>
          
          <form @submit.prevent="handleSubmit">
            <div class="input-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div class="input-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div class="input-group" v-if="!isLoginMode">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                v-model="confirmPassword" 
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button type="submit" class="btn btn-primary" :disabled="authStore.isLoading">
              {{ authStore.isLoading ? 'Loading...' : (isLoginMode ? 'Sign In' : 'Create Account') }}
            </button>
          </form>
          
          <p class="login-toggle">
            {{ isLoginMode ? "Don't have an account?" : 'Already have an account?' }}
            <span @click="toggleMode" class="login-toggle-link">
              {{ isLoginMode ? 'Sign Up' : 'Sign In' }}
            </span>
          </p>
        </div>

        <p class="login-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  </div>
</template>
