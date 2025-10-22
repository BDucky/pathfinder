<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { usePathStore } from '../stores/path'

const chatStore = useChatStore()
const pathStore = usePathStore()

const isOpen = ref(false)
const userInput = ref('')
const chatContainer = ref(null)
const isMinimized = ref(false)

// Quick action templates
const quickActions = [
  { icon: '📚', text: 'Giải thích khái niệm này', prompt: 'Giải thích cho tôi hiểu về: ' },
  { icon: '💡', text: 'Gợi ý bài tập', prompt: 'Hãy gợi ý cho tôi một bài tập thực hành về chủ đề hiện tại' },
  { icon: '🎯', text: 'Đánh giá tiến độ', prompt: 'Hãy đánh giá tiến độ học tập của tôi và cho lời khuyên' },
  { icon: '❓', text: 'Hỏi đáp', prompt: '' },
]

// Treat backend mode as available even without local keys
import { getActiveMode, API_BASE_URL } from '../config/api'
// Check if user has at least one AI API key or backend is enabled
const hasAIKey = computed(() => {
  const mode = getActiveMode()
  if (mode === 'backend') return true
  const geminiKey = localStorage.getItem('gemini_api_key')
  const groqKey = localStorage.getItem('groq_api_key')
  return !!(geminiKey || groqKey)
})

// Providers available list (reactive)
const providers = ref([])

// Resolve providers based on mode
async function resolveProviders() {
  const mode = getActiveMode()
  if (mode === 'backend') {
    try {
      const res = await fetch(`${API_BASE_URL}/providers`, { method: 'GET' })
      const json = await res.json().catch(() => null)
      const data = json?.data
      const list = []
      if (data?.providers?.gemini) list.push({ id: 'gemini', name: 'Google Gemini', icon: '🤖', speed: 'Chuẩn' })
      if (data?.providers?.groq) list.push({ id: 'groq', name: 'Groq (Llama 3.3)', icon: '⚡', speed: 'Siêu nhanh' })
      providers.value = list.length > 0 ? list : [
        { id: 'gemini', name: 'Google Gemini', icon: '🤖', speed: 'Chuẩn' }
      ]
    } catch (e) {
      // Fallback: assume at least Gemini available if backend mode enabled
      providers.value = [
        { id: 'gemini', name: 'Google Gemini', icon: '🤖', speed: 'Chuẩn' }
      ]
    }
  } else {
    const list = []
    if (localStorage.getItem('gemini_api_key')) list.push({ id: 'gemini', name: 'Google Gemini', icon: '🤖', speed: 'Chuẩn' })
    if (localStorage.getItem('groq_api_key')) list.push({ id: 'groq', name: 'Groq (Llama 3.3)', icon: '⚡', speed: 'Siêu nhanh' })
    providers.value = list
  }
}

const availableProviders = computed(() => providers.value)

// Current provider info - Hardcoded to Groq
const currentProvider = {
  id: 'groq',
  name: 'Groq (Llama 3.3)',
  icon: '⚡',
  speed: 'Siêu nhanh'
}

onMounted(() => {
  // Load saved messages and preferences
  chatStore.loadMessages()
  // Force provider to groq on load
  chatStore.switchProvider('groq')

  // Initialize chat with learning path context if available
  if (pathStore.learningPath && chatStore.messages.length === 0) {
    chatStore.initializeChat(pathStore.learningPath)
  }
})

// Watch for learning path changes to update context
watch(() => pathStore.learningPath, (newPath) => {
  if (newPath && chatStore.messages.length === 0) {
    chatStore.initializeChat(newPath)
  }
})

// Auto scroll to bottom when new messages arrive
watch(() => chatStore.messages.length, async () => {
  await nextTick()
  scrollToBottom()
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && chatStore.messages.length === 0 && pathStore.learningPath) {
    chatStore.initializeChat(pathStore.learningPath)
  }
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const closeChat = () => {
  isOpen.value = false
  isMinimized.value = false
}

const sendMessage = async () => {
  const message = userInput.value.trim()
  if (!message || chatStore.isTyping) return

  userInput.value = ''
  // Ensure provider is always groq
  await chatStore.sendMessage(message, 'groq')
}

const useQuickAction = (action) => {
  if (action.prompt) {
    userInput.value = action.prompt
  }
  // Focus on input
  nextTick(() => {
    document.getElementById('chat-input')?.focus()
  })
}

const clearChat = () => {
  if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) {
    chatStore.clearChat()
    if (pathStore.learningPath) {
      chatStore.initializeChat(pathStore.learningPath)
    }
  }
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// Handle Enter key
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <!-- Chat Button (when closed) -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 group relative"
      :class="{ 'animate-bounce': !hasAIKey }"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      
      <!-- Notification badge -->
      <span v-if="!hasAIKey" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        !
      </span>

      <!-- Tooltip -->
      <div class="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        💬 Chat với AI Learning Assistant
      </div>
    </button>

    <!-- Chat Window -->
    <div
      v-if="isOpen"
      class="bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300"
      :class="isMinimized ? 'h-16 w-80' : 'h-[600px] w-96'"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <h3 class="font-semibold text-sm">AI Learning Assistant</h3>
            <p v-if="currentProvider" class="text-xs text-primary-100">
              ⚡️ Powered by Groq
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="toggleMinimize"
            class="text-white hover:bg-primary-500 p-1 rounded transition-colors"
            :title="isMinimized ? 'Mở rộng' : 'Thu nhỏ'"
          >
            <svg v-if="!isMinimized" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            @click="closeChat"
            class="text-white hover:bg-primary-500 p-1 rounded transition-colors"
            title="Đóng"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Chat Body (hidden when minimized) -->
      <div v-show="!isMinimized" class="flex-1 flex flex-col overflow-hidden">
        <!-- No API Key Warning -->
        <div v-if="!hasAIKey" class="flex-1 flex items-center justify-center p-6 bg-yellow-50">
          <div class="text-center">
            <div class="text-5xl mb-3">🔑</div>
            <h4 class="font-semibold text-gray-900 mb-2">Cần API Key</h4>
            <p class="text-sm text-gray-600 mb-4">
              Vui lòng cấu hình ít nhất một AI API key để sử dụng chat.
            </p>
            <button
              @click="$emit('open-settings')"
              class="btn-primary text-sm"
            >
              ⚙️ Mở Settings
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div
          v-else
          ref="chatContainer"
          class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
          <div
            v-for="message in chatStore.messages"
            :key="message.id"
            class="flex"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2 shadow-sm"
              :class="[
                message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : message.isError
                    ? 'bg-red-50 text-red-900 rounded-bl-none border border-red-200'
                    : 'bg-white text-gray-900 rounded-bl-none'
              ]"
            >
              <!-- Message content with markdown-like formatting -->
              <div
                class="text-sm whitespace-pre-wrap break-words"
                v-html="message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')"
              ></div>
              <div
                class="text-xs mt-1 opacity-70"
                :class="message.role === 'user' ? 'text-right' : 'text-left'"
              >
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="chatStore.isTyping" class="flex justify-start">
            <div class="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div v-if="hasAIKey && chatStore.messages.length > 0" class="px-4 py-2 border-t border-gray-200 bg-white">
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="action in quickActions"
              :key="action.text"
              @click="useQuickAction(action)"
              class="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1"
              :title="action.text"
            >
              <span>{{ action.icon }}</span>
              <span class="hidden sm:inline">{{ action.text }}</span>
            </button>
          </div>
        </div>

        <!-- Input Area -->
        <div v-if="hasAIKey" class="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
          <!-- AI Provider Selector - REMOVED -->

          <!-- Input field -->
          <div class="flex gap-2">
            <textarea
              id="chat-input"
              v-model="userInput"
              @keydown="handleKeydown"
              placeholder="Nhập câu hỏi của bạn..."
              rows="1"
              class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :disabled="chatStore.isTyping"
            ></textarea>
            <button
              @click="sendMessage"
              :disabled="!userInput.trim() || chatStore.isTyping"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <!-- Clear chat button -->
          <div class="mt-2 flex justify-end">
            <button
              @click="clearChat"
              class="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa lịch sử chat
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Smooth animations */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fixed > div {
  animation: slideUp 0.3s ease-out;
}
</style>



