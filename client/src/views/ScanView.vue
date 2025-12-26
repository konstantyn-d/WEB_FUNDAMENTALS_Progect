<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import '../styles/scan.css'

import IconArrowLeft from '../assets/icons/arrow-left.svg'
import IconCamera from '../assets/icons/camera.svg'
import IconCheck from '../assets/icons/check.svg'
import IconWarning from '../assets/icons/warning.svg'
import IconLightbulb from '../assets/icons/lightbulb.svg'
import IconInfo from '../assets/icons/info.svg'
import IconHome from '../assets/icons/home.svg'
import IconHeartbeat from '../assets/icons/heartbeat.svg'

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

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="scan-page">
    <!-- Header -->
    <header class="scan-header">
      <button @click="goBack" class="scan-back-btn">
        <img :src="IconArrowLeft" alt="" class="icon" />
        <span>Back</span>
      </button>
      <div class="scan-header-title">
        <img :src="IconHeartbeat" alt="" class="icon" />
        <span>AI Skin Scanner</span>
      </div>
      <div class="scan-header-actions"></div>
    </header>

    <!-- Main Content -->
    <main class="scan-content">
      <!-- Error Message -->
      <div v-if="error" class="error-container">
        <div class="error-icon">
          <img :src="IconWarning" alt="" class="icon" />
        </div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-message">{{ error }}</p>
        <button @click="retakePhoto" class="scan-btn">
          <img :src="IconCamera" alt="" class="icon" />
          Try Again
        </button>
      </div>

      <!-- Results View -->
      <div v-else-if="analysisResult" class="results-container">
        <div class="results-header">
          <div class="results-icon">
            <img :src="IconCheck" alt="" class="icon" />
          </div>
          <h2 class="results-title">Analysis Complete</h2>
          <p class="results-subtitle">Here's what we found</p>
          <div class="skin-type-badge" v-if="analysisResult.skinType">
            Skin Type: {{ analysisResult.skinType }}
          </div>
        </div>

        <!-- Overall Assessment -->
        <div class="results-section">
          <h3 class="results-section-title">Overall Assessment</h3>
          <div class="results-card assessment-card">
            <p class="assessment-text">{{ analysisResult.overallAssessment }}</p>
          </div>
        </div>

        <!-- Issues Found -->
        <div class="results-section" v-if="analysisResult.issues?.length > 0">
          <h3 class="results-section-title">Issues Found ({{ analysisResult.issues.length }})</h3>
          <div 
            v-for="(issue, index) in analysisResult.issues" 
            :key="index" 
            class="results-card"
          >
            <div class="issue-header">
              <span class="issue-name">{{ issue.name }}</span>
              <span 
                class="issue-severity"
                :class="issue.severity"
              >
                {{ issue.severity }}
              </span>
            </div>
            <p class="issue-location">{{ issue.location }}</p>
            <p class="issue-description">{{ issue.description }}</p>
          </div>
        </div>

        <!-- No Issues -->
        <div class="results-section" v-else>
          <div class="results-card assessment-card">
            <div class="assessment-label">Great News</div>
            <p class="assessment-text">No significant skin issues were detected. Keep up your skincare routine!</p>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="results-section" v-if="analysisResult.recommendations?.length > 0">
          <h3 class="results-section-title">Recommendations</h3>
          <div 
            v-for="(rec, index) in analysisResult.recommendations" 
            :key="index"
            class="recommendation-item"
          >
            <div class="recommendation-icon">
              <img :src="IconLightbulb" alt="" class="icon" />
            </div>
            <p class="recommendation-text">{{ rec }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="results-actions">
          <button @click="retakePhoto" class="scan-btn scan-btn-secondary">
            <img :src="IconCamera" alt="" class="icon" />
            New Scan
          </button>
          <button @click="goToDashboard" class="scan-btn">
            <img :src="IconHome" alt="" class="icon" />
            Dashboard
          </button>
        </div>
      </div>

      <!-- Camera View -->
      <div v-else class="camera-container">
        <div class="camera-wrapper">
          <!-- Video Feed -->
          <video 
            ref="videoRef" 
            autoplay 
            playsinline
            v-show="isCameraActive && !capturedImage"
            class="camera-video"
          ></video>

          <!-- Captured Image -->
          <img 
            v-if="capturedImage" 
            :src="capturedImage" 
            alt="Captured photo"
            class="camera-captured-image"
          />

          <!-- Placeholder -->
          <div v-if="!isCameraActive && !capturedImage" class="camera-placeholder">
            <div class="camera-placeholder-icon">
              <img :src="IconCamera" alt="" class="icon" />
            </div>
            <h3 class="camera-placeholder-title">Ready to Scan</h3>
            <p class="camera-placeholder-text">
              Position your face in good lighting and start the camera to begin your skin analysis
            </p>
          </div>

          <!-- Face Guide -->
          <div class="face-guide" v-if="isCameraActive && !capturedImage">
            <div class="face-guide-oval"></div>
          </div>

          <!-- Analyzing Overlay -->
          <div v-if="isAnalyzing" class="analysis-loading">
            <div class="scanning-line"></div>
            <div class="analysis-loader">
              <div class="loader-ring"></div>
              <p class="loader-text">Analyzing your skin...</p>
              <p class="loader-subtext">This may take a few seconds</p>
            </div>
          </div>
        </div>

        <canvas ref="canvasRef" class="camera-canvas"></canvas>

        <!-- Controls -->
        <div class="scan-controls">
          <!-- Start Camera -->
          <button 
            v-if="!isCameraActive && !capturedImage" 
            @click="startCamera" 
            class="scan-btn"
          >
            <img :src="IconCamera" alt="" class="icon" />
            Start Camera
          </button>

          <!-- Capture Button -->
          <button 
            v-if="isCameraActive && !capturedImage" 
            @click="capturePhoto" 
            class="capture-btn"
          >
            <img :src="IconCamera" alt="" class="icon" />
          </button>

          <!-- Post Capture Actions -->
          <div v-if="capturedImage && !analysisResult && !isAnalyzing" class="scan-secondary-actions">
            <button @click="retakePhoto" class="scan-btn scan-btn-secondary">
              <img :src="IconCamera" alt="" class="icon" />
              Retake
            </button>
            <button @click="analyzeSkin" class="scan-btn">
              <img :src="IconHeartbeat" alt="" class="icon" />
              Analyze Skin
            </button>
          </div>
        </div>

        <!-- Tips -->
        <div class="scan-tips" v-if="!capturedImage && !isCameraActive">
          <div class="scan-tip">
            <div class="scan-tip-icon">
              <img :src="IconLightbulb" alt="" class="icon" />
            </div>
            <span class="scan-tip-text">Good lighting</span>
          </div>
          <div class="scan-tip">
            <div class="scan-tip-icon">
              <img :src="IconCamera" alt="" class="icon" />
            </div>
            <span class="scan-tip-text">Face camera directly</span>
          </div>
          <div class="scan-tip">
            <div class="scan-tip-icon">
              <img :src="IconCheck" alt="" class="icon" />
            </div>
            <span class="scan-tip-text">Remove makeup</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
