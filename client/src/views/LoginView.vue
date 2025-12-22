<script setup>
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    
    // ref() - reactive variable in Vue
    // When value changes, UI updates automatically
    const isLoginMode = ref(true)  // true = login form, false = signup form
    
    // Form data
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    
    // Router hook for programmatic navigation
    const router = useRouter()
    
    // Toggle between Login and Sign Up
    const toggleMode = () => {
      isLoginMode.value = !isLoginMode.value
      // Clear fields when switching
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
    }
    
    // Handle form submission
    const handleSubmit = async () => {
      // For now just log and navigate to dashboard
      // Later we'll add Supabase logic here
      console.log('Email:', email.value)
      console.log('Password:', password.value)
      
      if (!isLoginMode.value && password.value !== confirmPassword.value) {
        alert('Passwords do not match!')
        return
      }
      
      // Temporary: navigate to dashboard (will replace with real auth later)
      router.push({ name: 'dashboard' })
    }
    </script>
    
    <template>
      <div class="login-container">
        <div class="login-card">
          <!-- Title changes based on mode -->
          <h1>{{ isLoginMode ? 'Sign In' : 'Sign Up' }}</h1>
          <p class="subtitle">Skin Analyzer — AI-powered skin analysis</p>
          
          <form @submit.prevent="handleSubmit">
            <!-- v-model binds input to email variable -->
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
            
            <!-- Show only during registration -->
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
            
            <button type="submit" class="btn-primary">
              {{ isLoginMode ? 'Sign In' : 'Create Account' }}
            </button>
          </form>
          
          <!-- Link to toggle mode -->
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
    /* scoped = styles apply only to this component */
    
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
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
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