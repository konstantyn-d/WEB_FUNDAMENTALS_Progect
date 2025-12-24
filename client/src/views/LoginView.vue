<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  
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
  
        <div class="message error" v-if="errorMessage">
          {{ errorMessage }}
        </div>
  
        <div class="message success" v-if="successMessage">
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
          
          <button type="submit" class="btn-primary" :disabled="authStore.isLoading">
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
  
  <style scoped>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  
  .login-card {
    background: white;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 8px;
  }
  
  .subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
  }
  
  .message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }
  
  .message.error {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .message.success {
    background: #dcfce7;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  
  .input-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 6px;
    color: #555;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
  }
  
  input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .btn-primary {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }
  
  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .toggle-text {
    text-align: center;
    margin-top: 20px;
    color: #666;
  }
  
  .toggle-link {
    color: #667eea;
    cursor: pointer;
    font-weight: 600;
  }
  
  .toggle-link:hover {
    text-decoration: underline;
  }
  </style>