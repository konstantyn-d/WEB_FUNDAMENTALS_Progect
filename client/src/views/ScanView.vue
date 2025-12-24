<script setup>
  import { ref, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const API_URL = 'http://localhost:3000/api'
  
  const videoRef = ref(null)
  const canvasRef = ref(null)
  
  const isCameraActive = ref(false)
  const capturedImage = ref(null)
  const isAnalyzing = ref(false)
  const error = ref('')
  const analysisResult = ref(null)
  
  const startCamera = async () => {
    try {
      error.value = ''
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        isCameraActive.value = true
      }
    } catch (err) {
      console.error('Camera error:', err)
      error.value = 'Unable to access camera. Please allow camera permissions.'
    }
  }
  
  const stopCamera = () => {
    if (videoRef.value && videoRef.value.srcObject) {
      const tracks = videoRef.value.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.value.srcObject = null
      isCameraActive.value = false
    }
  }
  
  const capturePhoto = () => {
    if (!videoRef.value || !canvasRef.value) return
    
    const video = videoRef.value
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    capturedImage.value = canvas.toDataURL('image/jpeg', 0.8)
    
    stopCamera()
  }
  
  const retakePhoto = () => {
    capturedImage.value = null
    analysisResult.value = null
    error.value = ''
    startCamera()
  }
  
  const analyzeSkin = async () => {
    if (!capturedImage.value) return
    
    isAnalyzing.value = true
    error.value = ''
    
    try {
      const response = await fetch(`${API_URL}/scans/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          image: capturedImage.value
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed')
      }
      
      analysisResult.value = data.analysis
      
    } catch (err) {
      error.value = err.message || 'Analysis failed. Please try again.'
    } finally {
      isAnalyzing.value = false
    }
  }
  
  const goBack = () => {
    stopCamera()
    router.push({ name: 'dashboard' })
  }
  
  const goToDashboard = () => {
    router.push({ name: 'dashboard' })
  }
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return '#22c55e'
      case 'moderate': return '#f59e0b'
      case 'severe': return '#ef4444'
      default: return '#6b7280'
    }
  }
  
  onUnmounted(() => {
    stopCamera()
  })
  </script>
  
  <template>
    <div class="scan-page">
      <header class="scan-header">
        <button @click="goBack" class="back-btn">← Back</button>
        <h1>Skin Scanner</h1>
        <div class="spacer"></div>
      </header>
  
      <main class="scan-content">
        <div class="error-message" v-if="error">
          <span>⚠️ {{ error }}</span>
        </div>
  
        <!-- Results View -->
        <div v-if="analysisResult" class="results-container">
          <div class="results-header">
            <h2>✨ Analysis Complete</h2>
            <p class="skin-type">Skin Type: <strong>{{ analysisResult.skinType }}</strong></p>
          </div>
  
          <div class="overall-assessment">
            <h3>📋 Overall Assessment</h3>
            <p>{{ analysisResult.overallAssessment }}</p>
          </div>
  
          <div class="issues-section" v-if="analysisResult.issues?.length > 0">
            <h3>🔍 Issues Found ({{ analysisResult.issues.length }})</h3>
            <div class="issues-list">
              <div 
                v-for="(issue, index) in analysisResult.issues" 
                :key="index" 
                class="issue-card"
              >
                <div class="issue-header">
                  <span class="issue-name">{{ issue.name }}</span>
                  <span 
                    class="severity-badge" 
                    :style="{ backgroundColor: getSeverityColor(issue.severity) }"
                  >
                    {{ issue.severity }}
                  </span>
                </div>
                <p class="issue-location">📍 {{ issue.location }}</p>
                <p class="issue-description">{{ issue.description }}</p>
              </div>
            </div>
          </div>
  
          <div class="no-issues" v-else>
            <div class="no-issues-icon">✅</div>
            <h3>Great news!</h3>
            <p>No significant skin issues detected.</p>
          </div>
  
          <div class="recommendations-section" v-if="analysisResult.recommendations?.length > 0">
            <h3>💡 Recommendations</h3>
            <ul class="recommendations-list">
              <li v-for="(rec, index) in analysisResult.recommendations" :key="index">
                {{ rec }}
              </li>
            </ul>
          </div>
  
          <div class="results-actions">
            <button @click="retakePhoto" class="btn-secondary">
              🔄 New Scan
            </button>
            <button @click="goToDashboard" class="btn-primary">
              📊 Go to Dashboard
            </button>
          </div>
        </div>
  
        <!-- Camera View -->
        <div v-else>
          <div class="camera-container">
            <video 
              ref="videoRef" 
              autoplay 
              playsinline
              v-show="isCameraActive && !capturedImage"
              class="camera-view"
            ></video>
  
            <img 
              v-if="capturedImage" 
              :src="capturedImage" 
              alt="Captured photo"
              class="captured-photo"
            />
  
            <div 
              v-if="!isCameraActive && !capturedImage" 
              class="camera-placeholder"
            >
              <div class="placeholder-icon">📷</div>
              <p>Click "Start Camera" to begin</p>
            </div>
  
            <div class="face-guide" v-if="isCameraActive && !capturedImage">
              <div class="guide-oval"></div>
              <p class="guide-text">Position your face within the oval</p>
            </div>
          </div>
  
          <canvas ref="canvasRef" style="display: none;"></canvas>
  
          <div class="controls">
            <button 
              v-if="!isCameraActive && !capturedImage" 
              @click="startCamera" 
              class="btn-primary"
            >
              📷 Start Camera
            </button>
  
            <button 
              v-if="isCameraActive && !capturedImage" 
              @click="capturePhoto" 
              class="btn-capture"
            >
              <div class="capture-circle"></div>
            </button>
  
            <div v-if="capturedImage && !analysisResult" class="post-capture-controls">
              <button @click="retakePhoto" class="btn-secondary">
                🔄 Retake
              </button>
              <button 
                @click="analyzeSkin" 
                class="btn-primary"
                :disabled="isAnalyzing"
              >
                {{ isAnalyzing ? '🔄 Analyzing...' : '✨ Analyze Skin' }}
              </button>
            </div>
          </div>
  
          <div class="instructions" v-if="!capturedImage">
            <h3>Tips for best results:</h3>
            <ul>
              <li>🌞 Use good, natural lighting</li>
              <li>🧴 Remove makeup if possible</li>
              <li>📐 Face the camera directly</li>
              <li>😐 Keep a neutral expression</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <style scoped>
  .scan-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
  }
  
  .scan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
  }
  
  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
  }
  
  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .scan-header h1 {
    font-size: 24px;
    font-weight: 600;
  }
  
  .spacer {
    width: 80px;
  }
  
  .scan-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
  }
  
  .error-message {
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid #ff6b6b;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
  }
  
  /* Results Styles */
  .results-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
  }
  
  .results-header {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .results-header h2 {
    font-size: 28px;
    margin-bottom: 8px;
  }
  
  .skin-type {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .skin-type strong {
    color: #667eea;
    text-transform: capitalize;
  }
  
  .overall-assessment {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
  }
  
  .overall-assessment h3 {
    margin-bottom: 12px;
    color: #667eea;
  }
  
  .overall-assessment p {
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .issues-section h3,
  .recommendations-section h3 {
    margin-bottom: 16px;
    color: #667eea;
  }
  
  .issues-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .issue-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 16px;
    border-radius: 12px;
  }
  
  .issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .issue-name {
    font-weight: 600;
    font-size: 16px;
  }
  
  .severity-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .issue-location {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 8px;
  }
  
  .issue-description {
    font-size: 14px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .no-issues {
    text-align: center;
    padding: 40px 20px;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 12px;
    margin-bottom: 24px;
  }
  
  .no-issues-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .no-issues h3 {
    color: #22c55e;
    margin-bottom: 8px;
  }
  
  .recommendations-section {
    margin-bottom: 24px;
  }
  
  .recommendations-list {
    list-style: none;
    padding: 0;
  }
  
  .recommendations-list li {
    background: rgba(255, 255, 255, 0.1);
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 8px;
    padding-left: 40px;
    position: relative;
  }
  
  .recommendations-list li::before {
    content: '✓';
    position: absolute;
    left: 16px;
    color: #22c55e;
  }
  
  .results-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  
  /* Camera Styles */
  .camera-container {
    position: relative;
    width: 100%;
    aspect-ratio: 4/3;
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  
  .camera-view,
  .captured-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .camera-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
  }
  
  .placeholder-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  
  .face-guide {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  
  .guide-oval {
    width: 200px;
    height: 280px;
    border: 3px dashed rgba(102, 126, 234, 0.8);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); }
  }
  
  .guide-text {
    margin-top: 16px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .btn-primary {
    padding: 16px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    padding: 16px 32px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .btn-capture {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: white;
    border: 4px solid #667eea;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  
  .btn-capture:hover {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(102, 126, 234, 0.6);
  }
  
  .capture-circle {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
  }
  
  .post-capture-controls {
    display: flex;
    gap: 16px;
  }
  
  .instructions {
    background: rgba(255, 255, 255, 0.05);
    padding: 24px;
    border-radius: 12px;
  }
  
  .instructions h3 {
    margin-bottom: 16px;
    font-size: 16px;
    color: #667eea;
  }
  
  .instructions ul {
    list-style: none;
    padding: 0;
  }
  
  .instructions li {
    padding: 8px 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
  </style>