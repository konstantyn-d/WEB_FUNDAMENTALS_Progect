<script setup>
    import { ref, onMounted, onUnmounted } from 'vue'
    import { useRouter } from 'vue-router'
    
    const router = useRouter()
    
    // References to DOM elements
    const videoRef = ref(null)      // Camera video stream
    const canvasRef = ref(null)     // Canvas for capturing photo
    
    // State
    const isCameraActive = ref(false)
    const capturedImage = ref(null)  // Base64 image after capture
    const isAnalyzing = ref(false)
    const error = ref('')
    
    // Start camera
    const startCamera = async () => {
      try {
        error.value = ''
        // Request access to user's camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',  // Front camera
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })
        
        // Connect stream to video element
        if (videoRef.value) {
          videoRef.value.srcObject = stream
          isCameraActive.value = true
        }
      } catch (err) {
        console.error('Camera error:', err)
        error.value = 'Unable to access camera. Please allow camera permissions.'
      }
    }
    
    // Stop camera
    const stopCamera = () => {
      if (videoRef.value && videoRef.value.srcObject) {
        // Stop all tracks (turns off camera)
        const tracks = videoRef.value.srcObject.getTracks()
        tracks.forEach(track => track.stop())
        videoRef.value.srcObject = null
        isCameraActive.value = false
      }
    }
    
    // Capture photo from video stream
    const capturePhoto = () => {
      if (!videoRef.value || !canvasRef.value) return
      
      const video = videoRef.value
      const canvas = canvasRef.value
      const context = canvas.getContext('2d')
      
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to base64 image
      capturedImage.value = canvas.toDataURL('image/jpeg', 0.8)
      
      // Stop camera after capture
      stopCamera()
    }
    
    // Retake photo
    const retakePhoto = () => {
      capturedImage.value = null
      startCamera()
    }
    
    // Analyze skin (will connect to backend later)
    const analyzeSkin = async () => {
      if (!capturedImage.value) return
      
      isAnalyzing.value = true
      
      try {
        // TODO: Send image to backend for OpenAI analysis
        // For now, simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Navigate to dashboard with results (placeholder)
        console.log('Image ready for analysis:', capturedImage.value.substring(0, 50) + '...')
        alert('Analysis complete! (This is a placeholder - backend coming soon)')
        
        router.push({ name: 'dashboard' })
      } catch (err) {
        error.value = 'Analysis failed. Please try again.'
      } finally {
        isAnalyzing.value = false
      }
    }
    
    // Go back to dashboard
    const goBack = () => {
      stopCamera()
      router.push({ name: 'dashboard' })
    }
    
    // Cleanup on component unmount
    onUnmounted(() => {
      stopCamera()
    })
    </script>
    
    <template>
      <div class="scan-page">
        <!-- Header -->
        <header class="scan-header">
          <button @click="goBack" class="back-btn">← Back</button>
          <h1>Skin Scanner</h1>
          <div class="spacer"></div>
        </header>
    
        <!-- Main Content -->
        <main class="scan-content">
          <!-- Error Message -->
          <div class="error-message" v-if="error">
            <span>⚠️ {{ error }}</span>
          </div>
    
          <!-- Camera / Photo Container -->
          <div class="camera-container">
            <!-- Live Camera View -->
            <video 
              ref="videoRef" 
              autoplay 
              playsinline
              v-show="isCameraActive && !capturedImage"
              class="camera-view"
            ></video>
    
            <!-- Captured Photo -->
            <img 
              v-if="capturedImage" 
              :src="capturedImage" 
              alt="Captured photo"
              class="captured-photo"
            />
    
            <!-- Placeholder when camera is off -->
            <div 
              v-if="!isCameraActive && !capturedImage" 
              class="camera-placeholder"
            >
              <div class="placeholder-icon">📷</div>
              <p>Click "Start Camera" to begin</p>
            </div>
    
            <!-- Face Guide Overlay -->
            <div class="face-guide" v-if="isCameraActive && !capturedImage">
              <div class="guide-oval"></div>
              <p class="guide-text">Position your face within the oval</p>
            </div>
          </div>
    
          <!-- Hidden canvas for capturing -->
          <canvas ref="canvasRef" style="display: none;"></canvas>
    
          <!-- Controls -->
          <div class="controls">
            <!-- Start Camera Button -->
            <button 
              v-if="!isCameraActive && !capturedImage" 
              @click="startCamera" 
              class="btn-primary"
            >
              📷 Start Camera
            </button>
    
            <!-- Capture Button -->
            <button 
              v-if="isCameraActive && !capturedImage" 
              @click="capturePhoto" 
              class="btn-capture"
            >
              <div class="capture-circle"></div>
            </button>
    
            <!-- After Capture: Retake or Analyze -->
            <div v-if="capturedImage" class="post-capture-controls">
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
    
          <!-- Instructions -->
          <div class="instructions">
            <h3>Tips for best results:</h3>
            <ul>
              <li>🌞 Use good, natural lighting</li>
              <li>🧴 Remove makeup if possible</li>
              <li>📐 Face the camera directly</li>
              <li>😐 Keep a neutral expression</li>
            </ul>
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
    
    /* Header */
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
    
    /* Main Content */
    .scan-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px;
    }
    
    /* Error Message */
    .error-message {
      background: rgba(255, 107, 107, 0.2);
      border: 1px solid #ff6b6b;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    /* Camera Container */
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
    
    /* Face Guide Overlay */
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
    
    /* Controls */
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
    
    /* Capture Button */
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
    
    /* Instructions */
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