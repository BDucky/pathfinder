<script setup>
import { ref, onMounted } from 'vue'
import { usePathStore } from './stores/path'
import { getActiveMode } from './config/api'
import ApiSettings from './components/ApiSettings.vue'
import PathGeneratorForm from './components/PathGeneratorForm.vue'
import LearningPathDisplay from './components/LearningPathDisplay.vue'
import ChatAssistant from './components/ChatAssistant.vue'

const pathStore = usePathStore()
const showApiSettings = ref(false)
const hasApiKeys = ref(false)

onMounted(() => {
  // Ưu tiên backend mode: không yêu cầu người dùng nhập API keys
  const mode = getActiveMode()
  if (mode === 'backend') {
    hasApiKeys.value = true
  } else {
    // Kiểm tra xem có API keys không (client mode)
    const geminiKey = localStorage.getItem('gemini_api_key')
    const youtubeKey = localStorage.getItem('youtube_api_key')
    hasApiKeys.value = !!(geminiKey && youtubeKey)

    // Tự động hiển thị settings nếu chưa có keys
    if (!hasApiKeys.value) {
      showApiSettings.value = true
    }
  }

  // Tải lộ trình đã lưu nếu có
  pathStore.loadSavedPath()
})

const handleApiKeysSaved = () => {
  hasApiKeys.value = true
  showApiSettings.value = false
}

const handleGeneratePath = async (formData) => {
  await pathStore.generateLearningPath(formData)
}

const openSettingsFromChat = () => {
  showApiSettings.value = true
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-primary-600">🎯 Pathfinder</h1>
            <p class="text-gray-600 mt-1">AI-Powered Learning Path Generator</p>
          </div>
          <button
            @click="showApiSettings = !showApiSettings"
            class="btn-secondary"
          >
            ⚙️ API Settings
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- API Settings Modal -->
      <ApiSettings
        v-if="showApiSettings"
        @close="showApiSettings = false"
        @saved="handleApiKeysSaved"
      />

      <!-- Warning if no API keys -->
      <div v-if="!hasApiKeys && !showApiSettings" class="mb-6 card border-l-4 border-yellow-500">
        <div class="flex items-center">
          <span class="text-2xl mr-3">⚠️</span>
          <div>
            <h3 class="font-semibold text-gray-900">API Keys Required</h3>
            <p class="text-gray-600 text-sm">
              Vui lòng cấu hình API keys để sử dụng ứng dụng.
            </p>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Left Column: Form -->
        <div>
          <PathGeneratorForm
            :disabled="!hasApiKeys"
            :is-generating="pathStore.isGenerating"
            @generate="handleGeneratePath"
          />
        </div>

        <!-- Right Column: Results -->
        <div>
          <LearningPathDisplay />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="mt-16 bg-white border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-gray-500 text-sm">
          Made with ❤️ using Vue 3, Vite, Tailwind CSS & Google Gemini AI
        </p>
      </div>
    </footer>

    <!-- AI Chat Assistant (floating) -->
    <ChatAssistant @open-settings="openSettingsFromChat" />
  </div>
</template>

<style scoped>
/* Additional component-specific styles if needed */
</style>

