<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['close', 'saved'])

const geminiApiKey = ref('')
const youtubeApiKey = ref('')
const groqApiKey = ref('')
const showKeys = ref(false)
const saveSuccess = ref(false)

onMounted(() => {
  // Load existing keys if available
  geminiApiKey.value = localStorage.getItem('gemini_api_key') || ''
  youtubeApiKey.value = localStorage.getItem('youtube_api_key') || ''
  groqApiKey.value = localStorage.getItem('groq_api_key') || ''
})

const saveKeys = () => {
  if (!geminiApiKey.value.trim() || !youtubeApiKey.value.trim()) {
    alert('Vui lòng nhập ít nhất Gemini API key và YouTube API key')
    return
  }

  localStorage.setItem('gemini_api_key', geminiApiKey.value.trim())
  localStorage.setItem('youtube_api_key', youtubeApiKey.value.trim())
  
  if (groqApiKey.value.trim()) {
    localStorage.setItem('groq_api_key', groqApiKey.value.trim())
  }

  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
    emit('saved')
  }, 1500)
}

const clearKeys = () => {
  if (confirm('Bạn có chắc muốn xóa API keys đã lưu?')) {
    localStorage.removeItem('gemini_api_key')
    localStorage.removeItem('youtube_api_key')
    localStorage.removeItem('groq_api_key')
    geminiApiKey.value = ''
    youtubeApiKey.value = ''
    groqApiKey.value = ''
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">⚙️ API Configuration</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Info Alert -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <span class="text-blue-500 text-xl mr-3">ℹ️</span>
            <div class="flex-1 text-sm text-blue-800">
              <p class="font-semibold mb-1">Tại sao cần API Keys?</p>
              <p>Ứng dụng này chạy hoàn toàn trên trình duyệt của bạn. API keys sẽ được lưu trữ an toàn trong localStorage và chỉ bạn mới có quyền truy cập.</p>
            </div>
          </div>
        </div>

        <!-- Gemini API Key -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            🤖 Google Gemini API Key
          </label>
          <input
            v-model="geminiApiKey"
            :type="showKeys ? 'text' : 'password'"
            placeholder="AIza..."
            class="input-field"
          />
          <div class="mt-2 text-xs text-gray-600">
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              class="text-primary-600 hover:underline"
            >
              → Lấy Gemini API key miễn phí tại đây
            </a>
          </div>
        </div>

        <!-- YouTube API Key -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            🎥 YouTube Data API Key
          </label>
          <input
            v-model="youtubeApiKey"
            :type="showKeys ? 'text' : 'password'"
            placeholder="AIza..."
            class="input-field"
          />
          <div class="mt-2 text-xs text-gray-600">
            <a
              href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
              target="_blank"
              class="text-primary-600 hover:underline"
            >
              → Hướng dẫn lấy YouTube API key
            </a>
          </div>
        </div>

        <!-- Groq API Key (Optional) -->
        <div class="border-t border-gray-200 pt-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-semibold text-gray-700">
              🚀 Groq API Key
            </label>
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Tùy chọn - Miễn phí
            </span>
          </div>
          <input
            v-model="groqApiKey"
            :type="showKeys ? 'text' : 'password'"
            placeholder="gsk_..."
            class="input-field"
          />
          <div class="mt-2 text-xs text-gray-600 space-y-1">
            <p class="flex items-center">
              <span class="mr-1">⚡</span>
              <strong>Groq</strong>: AI cực nhanh, miễn phí 30 requests/phút
            </p>
            <a
              href="https://console.groq.com"
              target="_blank"
              class="text-primary-600 hover:underline inline-block"
            >
              → Lấy Groq API key miễn phí tại đây
            </a>
          </div>
        </div>

        <!-- Show/Hide Keys -->
        <div class="flex items-center">
          <input
            id="show-keys"
            v-model="showKeys"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label for="show-keys" class="ml-2 text-sm text-gray-700">
            Hiển thị API keys
          </label>
        </div>

        <!-- Instructions -->
        <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
          <p class="font-semibold">📋 Hướng dẫn nhanh:</p>
          <ol class="list-decimal list-inside space-y-1 ml-2">
            <li><strong>Bắt buộc:</strong> Lấy Gemini API key từ Google AI Studio (miễn phí)</li>
            <li><strong>Bắt buộc:</strong> Enable YouTube Data API v3 trong Google Cloud Console</li>
            <li><strong>Bắt buộc:</strong> Tạo API key cho YouTube Data API</li>
            <li><strong>Tùy chọn:</strong> Lấy Groq API key để chat với AI siêu nhanh (miễn phí)</li>
            <li>Nhập các keys vào form và lưu lại</li>
          </ol>
          <div class="mt-3 pt-3 border-t border-gray-200">
            <p class="text-xs text-gray-600">
              💡 <strong>Mẹo:</strong> Groq API cho phép bạn chat với AI Agent cực nhanh. 
              Nếu không có Groq key, bạn vẫn có thể chat bằng Gemini API.
            </p>
          </div>
        </div>

        <!-- Success Message -->
        <div
          v-if="saveSuccess"
          class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-center font-semibold"
        >
          ✅ API keys đã được lưu thành công!
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
          <button
            @click="saveKeys"
            class="flex-1 btn-primary"
          >
            💾 Lưu API Keys
          </button>
          <button
            v-if="geminiApiKey || youtubeApiKey"
            @click="clearKeys"
            class="btn-secondary"
          >
            🗑️ Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth animations */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

