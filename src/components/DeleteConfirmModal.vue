<script setup>
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <!-- Modal Overlay -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="cancel">
    <!-- Modal Content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all">
      <!-- Icon -->
      <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
        <span class="text-2xl">⚠️</span>
      </div>

      <!-- Title -->
      <h3 class="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        {{ title || t('common.confirm') }}
      </h3>

      <!-- Message -->
      <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
        {{ message }}
      </p>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="cancel"
          class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="confirm"
          class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          {{ t('common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>
