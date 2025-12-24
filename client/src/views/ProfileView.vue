<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  
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
        <button @click="goBack" class="back-btn">← Back</button>
        <h1>Profile</h1>
        <div class="spacer"></div>
      </header>
  
      <main class="profile-content">
        <div class="profile-card">
          <div class="avatar">
            <span class="avatar-icon">👤</span>
          </div>
          <div class="user-info">
            <h2>{{ user?.email || 'Loading...' }}</h2>
            <p class="join-date">Member since {{ formattedDate }}</p>
          </div>
        </div>
  
        <section class="stats-section">
          <h3>Your Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📷</div>
              <div class="stat-value">0</div>
              <div class="stat-label">Total Scans</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔍</div>
              <div class="stat-value">0</div>
              <div class="stat-label">Issues Found</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-value">Never</div>
              <div class="stat-label">Last Scan</div>
            </div>
          </div>
        </section>
  
        <section class="actions-section">
          <h3>Quick Actions</h3>
          <div class="action-buttons">
            <button @click="goToScan" class="action-btn scan">
              <span class="btn-icon">📷</span>
              <span>New Scan</span>
            </button>
            <button @click="goBack" class="action-btn dashboard">
              <span class="btn-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </div>
        </section>
  
        <section class="danger-section">
          <h3>Account</h3>
          <button @click="logout" class="logout-btn">
            🚪 Log Out
          </button>
        </section>
      </main>
    </div>
  </template>
  
  <style scoped>
  .profile-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }
  
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .back-btn {
    background: #f0f0f0;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
  }
  
  .back-btn:hover {
    background: #e0e0e0;
  }
  
  .profile-header h1 {
    font-size: 24px;
    color: #333;
  }
  
  .spacer {
    width: 80px;
  }
  
  .profile-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
  }
  
  .profile-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    display: flex;
    align-items: center;
    gap: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar-icon {
    font-size: 36px;
  }
  
  .user-info h2 {
    color: #333;
    font-size: 20px;
    margin-bottom: 4px;
  }
  
  .join-date {
    color: #666;
    font-size: 14px;
  }
  
  .stats-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
  }
  
  .stats-section h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  .stat-card {
    text-align: center;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
  }
  
  .stat-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 12px;
    color: #666;
  }
  
  .actions-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
  }
  
  .actions-section h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
  }
  
  .action-buttons {
    display: flex;
    gap: 16px;
  }
  
  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s;
  }
  
  .action-btn.scan {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .action-btn.dashboard {
    background: #f0f0f0;
    color: #333;
  }
  
  .action-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  
  .btn-icon {
    font-size: 24px;
  }
  
  .danger-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .danger-section h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
  }
  
  .logout-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .logout-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
  }
  </style>