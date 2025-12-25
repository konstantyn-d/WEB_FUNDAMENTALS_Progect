<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import '../styles/login.css'

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
  <div class="login-container">
    <div class="login-card">
      <h1>{{ isLoginMode ? 'Sign In' : 'Sign Up' }}</h1>
      <p class="subtitle">Skin Analyzer — AI-powered skin analysis</p>

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
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div class="input-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••"
            required
          />
        </div>
        
        <div class="input-group" v-if="!isLoginMode">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="••••••••"
            required
          />
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? 'Loading...' : (isLoginMode ? 'Sign In' : 'Create Account') }}
        </button>
      </form>
      
      <p class="toggle-text">
        {{ isLoginMode ? "Don't have an account?" : 'Already have an account?' }}
        <span @click="toggleMode" class="toggle-link">
          {{ isLoginMode ? 'Sign Up' : 'Sign In' }}
        </span>
      </p>
    </div>
  </div>
</template>
