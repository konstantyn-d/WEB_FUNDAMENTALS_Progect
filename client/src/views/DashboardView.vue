<script setup>
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    
    const router = useRouter()
    
    // User data placeholder (will come from Supabase later)
    const user = ref({
      email: 'user@example.com',
      scansCount: 0
    })
    
    // Skin analysis results (empty for now)
    const skinIssues = ref([])
    
    // Navigation functions
    const goToScan = () => {
      router.push({ name: 'scan' })
    }
    
    const goToProfile = () => {
      router.push({ name: 'profile' })
    }
    
    const logout = () => {
      // Will add Supabase logout logic later
      router.push({ name: 'login' })
    }
    </script>
    
    <template>
      <div class="dashboard">
        <!-- Navigation Bar -->
        <nav class="navbar">
          <div class="logo">🔬 Skin Analyzer</div>
          <div class="nav-links">
            <button @click="goToScan" class="nav-btn">📷 Scan</button>
            <button @click="goToProfile" class="nav-btn">👤 Profile</button>
            <button @click="logout" class="nav-btn logout">Log Out</button>
          </div>
        </nav>
    
        <!-- Main Content -->
        <main class="main-content">
          <h1>Welcome!</h1>
          <p class="welcome-text">Your AI-powered skin analysis dashboard</p>
    
          <!-- Quick Action Cards -->
          <div class="cards-grid">
            <!-- Scan Card -->
            <div class="card scan-card" @click="goToScan">
              <div class="card-icon">📷</div>
              <h3>New Scan</h3>
              <p>Take a photo of your face for AI skin analysis</p>
            </div>
    
            <!-- Stats Card -->
            <div class="card stats-card">
              <div class="card-icon">📊</div>
              <h3>Statistics</h3>
              <p>Total scans: {{ user.scansCount }}</p>
            </div>
    
            <!-- Tips Card -->
            <div class="card tips-card">
              <div class="card-icon">💡</div>
              <h3>Recommendations</h3>
              <p>Tips will appear after your first scan</p>
            </div>
          </div>
    
          <!-- Results Section -->
          <section class="results-section" v-if="skinIssues.length > 0">
            <h2>Latest Results</h2>
            <!-- Results will be displayed here after scanning -->
          </section>
    
          <!-- Empty State -->
          <section class="empty-state" v-else>
            <div class="empty-icon">🔍</div>
            <h2>No scans yet</h2>
            <p>Start your first skin analysis to get personalized recommendations</p>
            <button @click="goToScan" class="btn-primary">Start Scanning</button>
          </section>
        </main>
      </div>
    </template>
    
    <style scoped>
    .dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    /* Navigation Bar */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }
    
    .nav-links {
      display: flex;
      gap: 12px;
    }
    
    .nav-btn {
      padding: 10px 20px;
      border: none;
      background: #f0f0f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .nav-btn:hover {
      background: #e0e0e0;
      transform: translateY(-2px);
    }
    
    .nav-btn.logout {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      color: white;
    }
    
    .nav-btn.logout:hover {
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    }
    
    /* Main Content */
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    h1 {
      font-size: 36px;
      color: #333;
      margin-bottom: 8px;
    }
    
    .welcome-text {
      color: #666;
      font-size: 18px;
      margin-bottom: 40px;
    }
    
    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    
    .card {
      background: white;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s;
    }
    
    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
    
    .scan-card {
      cursor: pointer;
      border: 2px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
    }
    
    .scan-card:hover {
      border-color: #667eea;
    }
    
    .card-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .card h3 {
      color: #333;
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    .card p {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
    
    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    
    .empty-state h2 {
      color: #333;
      margin-bottom: 12px;
    }
    
    .empty-state p {
      color: #666;
      font-size: 16px;
      margin-bottom: 32px;
    }
    
    .btn-primary {
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
    
    /* Results Section */
    .results-section {
      background: white;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .results-section h2 {
      color: #333;
      margin-bottom: 24px;
    }
    </style>