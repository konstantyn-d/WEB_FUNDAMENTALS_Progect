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
      <button @click="goBack" class="back-btn">
        <img :src="IconArrowLeft" alt="" class="icon" />
        Back
      </button>
      <h1>Skin Scanner</h1>
      <div class="spacer"></div>
    </header>

    <main class="scan-content">
      <div class="error-message" v-if="error">
        <img :src="IconWarning" alt="" class="icon" />
        <span>{{ error }}</span>
      </div>

      <!-- Results View -->
      <div v-if="analysisResult" class="results-container">
        <div class="results-header">
          <h2>Analysis Complete</h2>
          <p class="skin-type">Skin Type: <strong>{{ analysisResult.skinType }}</strong></p>
        </div>

        <div class="overall-assessment">
          <h3>
            <img :src="IconInfo" alt="" class="icon" />
            Overall Assessment
          </h3>
          <p>{{ analysisResult.overallAssessment }}</p>
        </div>

        <div class="issues-section" v-if="analysisResult.issues?.length > 0">
          <h3>
            <img :src="IconWarning" alt="" class="icon" />
            Issues Found ({{ analysisResult.issues.length }})
          </h3>
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
              <p class="issue-location">{{ issue.location }}</p>
              <p class="issue-description">{{ issue.description }}</p>
            </div>
          </div>
        </div>

        <div class="no-issues" v-else>
          <div class="no-issues-icon">
            <img :src="IconCheck" alt="" class="icon icon-xl" />
          </div>
          <h3>Great news!</h3>
          <p>No significant skin issues detected.</p>
        </div>

        <div class="recommendations-section" v-if="analysisResult.recommendations?.length > 0">
          <h3>
            <img :src="IconLightbulb" alt="" class="icon" />
            Recommendations
          </h3>
          <ul class="recommendations-list">
            <li v-for="(rec, index) in analysisResult.recommendations" :key="index">
              <img :src="IconCheck" alt="" class="icon icon-sm" />
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>

        <div class="results-actions">
          <button @click="retakePhoto" class="btn-secondary">
            <img :src="IconCamera" alt="" class="icon" />
            New Scan
          </button>
          <button @click="goToDashboard" class="btn-primary">
            <img :src="IconHome" alt="" class="icon" />
            Go to Dashboard
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
            <div class="placeholder-icon">
              <img :src="IconCamera" alt="" class="icon icon-xl" />
            </div>
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
            <img :src="IconCamera" alt="" class="icon" />
            Start Camera
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
              <img :src="IconCamera" alt="" class="icon" />
              Retake
            </button>
            <button 
              @click="analyzeSkin" 
              class="btn-primary"
              :disabled="isAnalyzing"
            >
              {{ isAnalyzing ? 'Analyzing...' : 'Analyze Skin' }}
            </button>
          </div>
        </div>

        <div class="instructions" v-if="!capturedImage">
          <h3>
            <img :src="IconLightbulb" alt="" class="icon" />
            Tips for best results
          </h3>
          <ul>
            <li>
              <img :src="IconCheck" alt="" class="icon icon-sm" />
              Use good, natural lighting
            </li>
            <li>
              <img :src="IconCheck" alt="" class="icon icon-sm" />
              Remove makeup if possible
            </li>
            <li>
              <img :src="IconCheck" alt="" class="icon icon-sm" />
              Face the camera directly
            </li>
            <li>
              <img :src="IconCheck" alt="" class="icon icon-sm" />
              Keep a neutral expression
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>
