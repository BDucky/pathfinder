<script setup>
import { computed } from 'vue'
import { usePathStore } from '../stores/path'

const pathStore = usePathStore()

const hasPath = computed(() => pathStore.hasPath)
const learningPath = computed(() => pathStore.learningPath)
const isGenerating = computed(() => pathStore.isGenerating)
const currentStep = computed(() => pathStore.currentStep)
const progress = computed(() => pathStore.progress)
const error = computed(() => pathStore.error)

const toggleCompletion = (weekNumber) => {
  pathStore.toggleWeekCompletion(weekNumber)
}

const clearPath = () => {
  if (confirm('Bạn có chắc muốn xóa lộ trình này?')) {
    pathStore.clearPath()
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isGenerating" class="card">
      <div class="text-center py-8">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
          <svg class="animate-spin h-16 w-16 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {{ currentStep }}
        </h3>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-600">{{ progress }}%</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error && !isGenerating" class="card border-l-4 border-red-500">
      <div class="flex items-start">
        <span class="text-2xl mr-3">❌</span>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 mb-1">Có lỗi xảy ra</h3>
          <p class="text-sm text-gray-600">{{ error }}</p>
          <button
            @click="pathStore.error = null"
            class="mt-3 text-sm text-primary-600 hover:underline"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasPath && !isGenerating" class="card text-center py-12">
      <div class="text-6xl mb-4">🎯</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        Bắt đầu hành trình học tập
      </h3>
      <p class="text-gray-600">
        Điền thông tin vào form bên trái để AI tạo lộ trình học tập cho bạn
      </p>
    </div>

    <!-- Learning Path Display -->
    <div v-if="hasPath && !isGenerating" class="space-y-6">
      <!-- Path Header -->
      <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h2 class="text-2xl font-bold mb-2">{{ learningPath.title }}</h2>
            <p class="text-primary-100">
              📚 {{ learningPath.topic }} • {{ learningPath.level }} • {{ learningPath.totalWeeks }} tuần
            </p>
          </div>
          <button
            @click="clearPath"
            class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-1 text-sm transition-colors"
          >
            🗑️
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
          <div
            class="bg-white h-full transition-all duration-500"
            :style="{ width: `${pathStore.progressPercentage}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-sm mt-2 text-primary-100">
          <span>Tiến độ: {{ pathStore.completedWeeks }}/{{ pathStore.totalWeeks }} tuần</span>
          <span>{{ pathStore.progressPercentage }}%</span>
        </div>

        <p v-if="learningPath.createdAt" class="text-xs text-primary-100 mt-3">
          Tạo ngày: {{ formatDate(learningPath.createdAt) }}
        </p>
      </div>

      <!-- Weekly Breakdown -->
      <div class="space-y-4">
        <div
          v-for="week in learningPath.weeks"
          :key="week.weekNumber"
          class="card hover:shadow-lg transition-shadow"
          :class="{ 'bg-green-50 border-2 border-green-200': week.completed }"
        >
          <!-- Week Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl font-bold text-primary-600">
                  Tuần {{ week.weekNumber }}
                </span>
                <span
                  v-if="week.completed"
                  class="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full"
                >
                  ✓ Hoàn thành
                </span>
              </div>
              <h3 class="text-xl font-bold text-gray-900">{{ week.title }}</h3>
              <p class="text-sm text-gray-600 mt-1">
                ⏱️ {{ week.estimatedHours }} giờ
              </p>
            </div>
            <button
              @click="toggleCompletion(week.weekNumber)"
              class="ml-4 px-4 py-2 rounded-lg font-medium transition-colors"
              :class="week.completed
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              "
            >
              {{ week.completed ? '✓' : '○' }}
            </button>
          </div>

          <!-- Objectives -->
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 mb-2">🎯 Mục tiêu:</h4>
            <ul class="space-y-1">
              <li
                v-for="(objective, idx) in week.objectives"
                :key="idx"
                class="text-sm text-gray-700 flex items-start"
              >
                <span class="text-primary-600 mr-2">•</span>
                <span>{{ objective }}</span>
              </li>
            </ul>
          </div>

          <!-- Topics -->
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 mb-2">📖 Chủ đề:</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(topic, idx) in week.topics"
                :key="idx"
                class="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full"
              >
                {{ topic }}
              </span>
            </div>
          </div>

          <!-- Exercises -->
          <div v-if="week.exercises" class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 class="font-semibold text-gray-900 mb-1 flex items-center">
              <span class="mr-2">💪</span> Thực hành:
            </h4>
            <p class="text-sm text-gray-700">{{ week.exercises }}</p>
          </div>

          <!-- Video Resources -->
          <div v-if="week.resources && week.resources.length > 0">
            <h4 class="font-semibold text-gray-900 mb-3">🎥 Tài nguyên học liệu:</h4>
            <div class="space-y-3">
              <a
                v-for="video in week.resources"
                :key="video.id"
                :href="video.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <img
                  :src="video.thumbnail"
                  :alt="video.title"
                  class="w-32 h-20 object-cover rounded flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <h5 class="font-medium text-gray-900 text-sm group-hover:text-primary-600 line-clamp-2">
                    {{ video.title }}
                  </h5>
                  <p class="text-xs text-gray-600 mt-1">{{ video.channelTitle }}</p>
                </div>
                <div class="flex-shrink-0 text-gray-400 group-hover:text-primary-600">
                  →
                </div>
              </a>
            </div>
          </div>

          <!-- No resources message -->
          <div v-else class="text-sm text-gray-500 italic">
            Không tìm thấy video phù hợp. Bạn có thể tự tìm kiếm trên YouTube với từ khóa: {{ week.searchKeywords?.join(', ') }}
          </div>
        </div>
      </div>

      <!-- Completion Message -->
      <div v-if="pathStore.progressPercentage === 100" class="card bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-8">
        <div class="text-5xl mb-3">🎉</div>
        <h3 class="text-2xl font-bold mb-2">Chúc mừng!</h3>
        <p>Bạn đã hoàn thành toàn bộ lộ trình học tập!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

