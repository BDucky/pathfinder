<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePathsStore } from '../stores/paths'
import { useLanguage } from '../composables/useLanguage'
import { getActiveMode } from '../config/api'

const router = useRouter()
const pathsStore = usePathsStore()
const { t } = useLanguage()

const hasApiKeys = ref(false)
const topic = ref('')
const level = ref('beginner')
const duration = ref(4)
const hoursPerWeek = ref(10)

onMounted(() => {
  const mode = getActiveMode()
  if (mode === 'backend') {
    hasApiKeys.value = true
  } else {
    const geminiKey = localStorage.getItem('gemini_api_key')
    const youtubeKey = localStorage.getItem('youtube_api_key')
    hasApiKeys.value = !!(geminiKey && youtubeKey)
  }
})

const levelOptions = [
  { value: 'beginner', icon: '🌱' },
  { value: 'intermediate', icon: '🚀' },
  { value: 'advanced', icon: '⚡' },
  { value: 'expert', icon: '🎯' }
]

const isFormValid = ref(true)

async function handleSubmit() {
  if (!topic.value.trim() || duration.value < 1 || hoursPerWeek.value < 1) {
    isFormValid.value = false
    return
  }

  // Clear any previous errors
  pathsStore.error = null

  try {
    const newPath = await pathsStore.generateLearningPath({
      topic: topic.value.trim(),
      level: level.value,
      duration: duration.value,
      hoursPerWeek: hoursPerWeek.value
    })

    // Navigate to the newly created path detail
    router.push(`/path/${newPath.id}`)
  } catch (error) {
    console.error('Error creating path:', error)
    // Error is already set in the store, just log it here
  }
}

function cancel() {
  router.push('/dashboard')
}

function dismissError() {
  pathsStore.error = null
  pathsStore.currentStep = ''
  pathsStore.progress = 0
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 relative">
    <!-- Full Screen Loading Overlay -->
    <div
      v-if="pathsStore.isGenerating"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div class="text-center">
          <div class="flex justify-center mb-4">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {{ t('form.generating') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ pathsStore.currentStep }}
          </p>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              class="bg-primary-600 h-3 rounded-full transition-all duration-300"
              :style="{ width: `${pathsStore.progress}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ pathsStore.progress }}%
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <button
          @click="cancel"
          class="mb-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          ← {{ t('detail.backToDashboard') }}
        </button>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ t('form.title') }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ t('form.description') }}
        </p>
      </div>

      <!-- Warning if no API keys -->
      <div v-if="!hasApiKeys" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
        <div class="flex items-center">
          <span class="text-2xl mr-3">⚠️</span>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.warning') }}</h3>
          </div>
        </div>
      </div>

      <!-- Form Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Topic Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('form.topic.label') }}
            </label>
            <input
              v-model="topic"
              type="text"
              :placeholder="t('form.topic.placeholder')"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :disabled="pathsStore.isGenerating"
              required
            />
          </div>

          <!-- Level Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ t('form.level.label') }}
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="option in levelOptions"
                :key="option.value"
                @click="level = option.value"
                class="cursor-pointer p-4 border-2 rounded-lg transition-all"
                :class="{
                  'border-primary-500 bg-primary-50 dark:bg-primary-900/20': level === option.value,
                  'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700': level !== option.value
                }"
              >
                <div class="flex items-center">
                  <span class="text-2xl mr-3">{{ option.icon }}</span>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ t(`form.level.${option.value}`) }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">
                      {{ t(`form.level.${option.value}Desc`) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('form.duration.label') }}
            </label>
            <input
              v-model.number="duration"
              type="number"
              min="1"
              max="52"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :disabled="pathsStore.isGenerating"
              required
            />
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('form.duration.min') }} - {{ t('form.duration.max') }}
            </p>
          </div>

          <!-- Hours per Week -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('form.hoursPerWeek.label') }}
            </label>
            <input
              v-model.number="hoursPerWeek"
              type="number"
              min="1"
              max="168"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :disabled="pathsStore.isGenerating"
              required
            />
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('form.hoursPerWeek.min') }} - {{ t('form.hoursPerWeek.max') }}
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="pathsStore.error" class="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
            <div class="flex items-start justify-between">
              <div class="flex items-start">
                <span class="text-2xl mr-3">❌</span>
                <div>
                  <h3 class="font-semibold text-red-800 dark:text-red-300">{{ t('common.error') }}</h3>
                  <p class="text-red-700 dark:text-red-400 text-sm mt-1">
                    {{ pathsStore.error }}
                  </p>
                </div>
              </div>
              <button
                @click="dismissError"
                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              :disabled="!hasApiKeys || pathsStore.isGenerating"
              class="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-md transition-colors"
            >
              {{ pathsStore.isGenerating ? t('form.generating') : t('form.submit') }}
            </button>
            <button
              type="button"
              @click="cancel"
              :disabled="pathsStore.isGenerating"
              class="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              {{ t('form.cancel') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
