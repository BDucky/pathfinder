<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePathStore } from '../stores/path'
import { useLanguage } from '../composables/useLanguage'
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue'

const router = useRouter()
const pathStore = usePathStore()
const { t } = useLanguage()

const showDeleteModal = ref(false)
const pathToDelete = ref(null)

onMounted(() => {
  pathStore.loadPathsFromStorage()
})

const paths = computed(() => pathStore.learningPaths)
const completedPathsCount = computed(() => pathStore.completedPathsCount)
const inProgressPathsCount = computed(() => pathStore.inProgressPathsCount)

function viewPath(pathId) {
  router.push(`/path/${pathId}`)
}

function createNewPath() {
  router.push('/create')
}

function confirmDelete(pathId) {
  pathToDelete.value = pathId
  showDeleteModal.value = true
}

function deletePath() {
  if (pathToDelete.value) {
    pathStore.deletePath(pathToDelete.value)
  }
  showDeleteModal.value = false
  pathToDelete.value = null
}

function cancelDelete() {
  showDeleteModal.value = false
  pathToDelete.value = null
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getProgress(path) {
  if (!path || !path.weeks || path.weeks.length === 0) return 0
  const completed = path.weeks.filter(w => w.completed).length
  return Math.round((completed / path.weeks.length) * 100)
}

function getStatus(path) {
  const progress = getProgress(path)
  if (progress === 100) return { text: 'Completed', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  if (progress > 0) return { text: 'In Progress', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
  return { text: 'Not Started', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ t('dashboard.title') }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ t('dashboard.subtitle') }}
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-4xl">📚</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ t('dashboard.total') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ paths.length }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-4xl">🚀</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ t('dashboard.inProgress') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ inProgressPathsCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-4xl">✅</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ t('dashboard.completed') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ completedPathsCount }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Create New Button -->
      <div class="mb-6">
        <button
          @click="createNewPath"
          class="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-md transition-colors"
        >
          <span class="text-xl mr-2">➕</span>
          {{ t('dashboard.createNew') }}
        </button>
      </div>

      <!-- Paths List -->
      <div v-if="paths.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="path in paths"
          :key="path.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col"
        >
          <!-- Card Header -->
          <div class="p-6 flex-grow">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {{ path.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ path.topic }}
                </p>
              </div>
              <span
                class="px-3 py-1 text-xs font-medium rounded-full"
                :class="getStatus(path).class"
              >
                {{ getStatus(path).text }}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="mb-4">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-600 dark:text-gray-400">{{ t('dashboard.card.progress') }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ getProgress(path) }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-primary-600 h-2 rounded-full transition-all"
                  :style="{ width: `${getProgress(path)}%` }"
                ></div>
              </div>
            </div>

            <!-- Meta Info -->
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center">
                <span class="mr-2">📅</span>
                <span>{{ t('dashboard.card.created') }}: {{ formatDate(path.createdAt) }}</span>
              </div>
              <div class="flex items-center">
                <span class="mr-2">⏱️</span>
                <span>{{ path.totalWeeks }} {{ t('dashboard.card.weeks') }}</span>
              </div>
              <div class="flex items-center">
                <span class="mr-2">🕒</span>
                <span>{{ path.hoursPerWeek }} {{ t('dashboard.card.hoursPerWeek') }}</span>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              @click="viewPath(path.id)"
              class="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {{ t('dashboard.card.viewDetails') }}
            </button>
            <button
              @click="confirmDelete(path.id)"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ t('dashboard.empty') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ t('dashboard.emptyDesc') }}
        </p>
        <button
          @click="createNewPath"
          class="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-md transition-colors"
        >
          <span class="text-xl mr-2">➕</span>
          {{ t('dashboard.createNew') }}
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="showDeleteModal"
      :message="t('dashboard.card.confirmDelete')"
      @confirm="deletePath"
      @cancel="cancelDelete"
    />
  </div>
</template>
