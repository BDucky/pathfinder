<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  isGenerating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['generate'])

// Form data
const topic = ref('')
const level = ref('beginner')
const duration = ref(4)
const hoursPerWeek = ref(10)

// Form validation
const isFormValid = computed(() => {
  return topic.value.trim().length > 0 &&
         duration.value > 0 &&
         hoursPerWeek.value > 0
})

const handleSubmit = () => {
  if (!isFormValid.value || props.disabled || props.isGenerating) {
    return
  }

  emit('generate', {
    topic: topic.value.trim(),
    level: level.value,
    duration: duration.value,
    hoursPerWeek: hoursPerWeek.value
  })
}

// Level options
const levelOptions = [
  { value: 'beginner', label: '🌱 Beginner - Bắt đầu từ con số 0', description: 'Chưa có kiến thức nền tảng' },
  { value: 'intermediate', label: '🚀 Intermediate - Đã có kiến thức cơ bản', description: 'Hiểu các khái niệm cơ bản' },
  { value: 'advanced', label: '⚡ Advanced - Muốn nâng cao kỹ năng', description: 'Có kinh nghiệm thực tế' },
  { value: 'expert', label: '🎯 Expert - Chuyên sâu chuyên môn', description: 'Muốn trở thành chuyên gia' }
]
</script>

<template>
  <div class="card">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      📝 Tạo Lộ Trình Học Tập
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Topic Input -->
      <div>
        <label for="topic" class="block text-sm font-semibold text-gray-700 mb-2">
          Chủ đề bạn muốn học
        </label>
        <input
          id="topic"
          v-model="topic"
          type="text"
          placeholder="Ví dụ: Web Development, Machine Learning, Photography..."
          class="input-field"
          :disabled="disabled || isGenerating"
          required
        />
        <p class="mt-1 text-xs text-gray-500">
          Hãy cụ thể để AI có thể tạo lộ trình tốt nhất cho bạn
        </p>
      </div>

      <!-- Level Selection -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">
          Trình độ hiện tại
        </label>
        <div class="space-y-2">
          <div
            v-for="option in levelOptions"
            :key="option.value"
            class="relative"
          >
            <input
              :id="option.value"
              v-model="level"
              type="radio"
              :value="option.value"
              :disabled="disabled || isGenerating"
              class="peer sr-only"
            />
            <label
              :for="option.value"
              class="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-all"
            >
              <div class="flex-1">
                <div class="font-semibold text-gray-900">{{ option.label }}</div>
                <div class="text-xs text-gray-600 mt-1">{{ option.description }}</div>
              </div>
              <div class="ml-3 text-primary-600 opacity-0 peer-checked:opacity-100">
                ✓
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Duration Slider -->
      <div>
        <label for="duration" class="block text-sm font-semibold text-gray-700 mb-2">
          Thời gian học: <span class="text-primary-600">{{ duration }} tuần</span>
        </label>
        <input
          id="duration"
          v-model.number="duration"
          type="range"
          min="1"
          max="12"
          step="1"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          :disabled="disabled || isGenerating"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 tuần</span>
          <span>12 tuần</span>
        </div>
      </div>

      <!-- Hours Per Week Slider -->
      <div>
        <label for="hours" class="block text-sm font-semibold text-gray-700 mb-2">
          Số giờ học mỗi tuần: <span class="text-primary-600">{{ hoursPerWeek }} giờ</span>
        </label>
        <input
          id="hours"
          v-model.number="hoursPerWeek"
          type="range"
          min="1"
          max="20"
          step="1"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          :disabled="disabled || isGenerating"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 giờ</span>
          <span>20 giờ</span>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
        <div class="text-sm text-gray-700">
          <p class="font-semibold mb-2">📊 Tổng quan:</p>
          <ul class="space-y-1">
            <li>• Tổng thời gian: <strong>{{ duration * hoursPerWeek }} giờ</strong></li>
            <li>• Cam kết: <strong>{{ hoursPerWeek }} giờ/tuần × {{ duration }} tuần</strong></li>
            <li>• Mục tiêu: <strong>{{ topic || 'Chưa chọn' }}</strong></li>
          </ul>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="w-full btn-primary text-lg py-3"
        :disabled="!isFormValid || disabled || isGenerating"
      >
        <span v-if="isGenerating" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang tạo lộ trình...
        </span>
        <span v-else>
          ✨ Tạo Lộ Trình AI
        </span>
      </button>
    </form>
  </div>
</template>

<style scoped>
/* Custom radio button styling is handled by Tailwind's peer utilities */
</style>

