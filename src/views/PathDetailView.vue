<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePathsStore } from '../stores/paths'
import { useLanguage } from '../composables/useLanguage'
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const pathsStore = usePathsStore()
const { t } = useLanguage()

const pathId = route.params.id
const showDeleteModal = ref(false)

onMounted(() => {
  pathsStore.loadPaths()
  pathsStore.setCurrentPath(pathId)
})

const path = computed(() => pathsStore.currentPath)
const progress = computed(() => pathsStore.getPathProgress(pathId))

function goBack() {
  router.push('/dashboard')
}

function toggleWeek(weekNumber) {
  pathsStore.toggleWeekCompletion(pathId, weekNumber)
}

function isWeekCompleted(weekNumber) {
  return path.value?.completedWeeks?.includes(weekNumber) || false
}

function confirmDelete() {
  showDeleteModal.value = true
}

function deletePath() {
  pathsStore.deletePath(pathId)
  showDeleteModal.value = false
  router.push('/dashboard')
}

function cancelDelete() {
  showDeleteModal.value = false
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div v-if="path" class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <button
          @click="goBack"
          class="mb-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          ← {{ t('detail.backToDashboard') }}
        </button>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ path.title }}
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              {{ path.topic }}
            </p>
          </div>
          <button
            @click="confirmDelete"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            🗑️ {{ t('detail.deletePath') }}
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar - Path Info -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-8">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {{ t('detail.pathInfo') }}
            </h2>

            <!-- Progress Circle -->
            <div class="mb-6 text-center">
              <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <div class="text-center">
                  <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {{ progress }}%
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('detail.progress') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Info List -->
            <div class="space-y-4">
              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('detail.topic') }}</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ path.topic }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('detail.level') }}</div>
                <div class="font-medium text-gray-900 dark:text-white capitalize">{{ path.level }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('detail.duration') }}</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ path.totalWeeks }} {{ t('dashboard.card.weeks') }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('detail.hoursPerWeek') }}</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ path.hoursPerWeek }} {{ t('path.hours') }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('detail.createdAt') }}</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ formatDate(path.createdAt) }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('detail.progress') }}</div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ path.completedWeeks.length }} / {{ path.weeks.length }} {{ t('dashboard.card.weeks') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content - Weekly Plan -->
        <div class="lg:col-span-2">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {{ t('detail.weeklyPlan') }}
          </h2>

          <!-- Weeks List -->
          <div class="space-y-6">
            <div
              v-for="week in path.weeks"
              :key="week.weekNumber"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all"
              :class="{
                'ring-2 ring-green-500': isWeekCompleted(week.weekNumber)
              }"
            >
              <!-- Week Header -->
              <div
                class="p-6 cursor-pointer"
                :class="{
                  'bg-green-50 dark:bg-green-900/20': isWeekCompleted(week.weekNumber)
                }"
                @click="toggleWeek(week.weekNumber)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <span class="text-2xl mr-3">
                        {{ isWeekCompleted(week.weekNumber) ? '✅' : '⭕' }}
                      </span>
                      <div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                          {{ t('path.week') }} {{ week.weekNumber }}: {{ week.title }}
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ week.estimatedHours }} {{ t('path.hours') }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Objectives -->
                <div class="mt-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    🎯 {{ t('path.objectives') }}
                  </h4>
                  <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    <li v-for="(objective, idx) in week.objectives" :key="idx">
                      {{ objective }}
                    </li>
                  </ul>
                </div>

                <!-- Topics -->
                <div class="mt-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    📚 {{ t('path.topics') }}
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="(topic, idx) in week.topics"
                      :key="idx"
                      class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm rounded-full"
                    >
                      {{ topic }}
                    </span>
                  </div>
                </div>

                <!-- Exercises -->
                <div v-if="week.exercises" class="mt-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    💪 {{ t('path.exercises') }}
                  </h4>
                  <p class="text-gray-700 dark:text-gray-300">
                    {{ week.exercises }}
                  </p>
                </div>

                <!-- Resources/Videos -->
                <div v-if="week.resources && week.resources.length > 0" class="mt-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                    🎥 {{ t('path.resources') }}
                  </h4>
                  <div class="grid gap-3">
                    <a
                      v-for="video in week.resources"
                      :key="video.id"
                      :href="video.url"
                      target="_blank"
                      class="flex items-start p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img
                        :src="video.thumbnail"
                        :alt="video.title"
                        class="w-32 h-20 object-cover rounded flex-shrink-0"
                      />
                      <div class="ml-3 flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                          {{ video.title }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {{ video.channelTitle }}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading/Not Found State -->
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div class="text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('common.loading') }}
      </h2>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmModal
    v-if="showDeleteModal"
    :message="t('dashboard.card.confirmDelete')"
    @confirm="deletePath"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
