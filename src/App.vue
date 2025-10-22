<script setup>
import { ref, onMounted } from 'vue'
import { usePathsStore } from './stores/paths'
import { useTheme } from './composables/useTheme'
import { useLanguage } from './composables/useLanguage'
import AppHeader from './components/AppHeader.vue'
import ApiSettings from './components/ApiSettings.vue'
import ChatAssistant from './components/ChatAssistant.vue'

const pathsStore = usePathsStore()
const { t } = useLanguage()
const { isDark } = useTheme()

const showApiSettings = ref(false)

onMounted(() => {
  // Load saved paths on app mount
  pathsStore.loadPaths()
})

function openSettings() {
  showApiSettings.value = true
}

function closeSettings() {
  showApiSettings.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <AppHeader @open-settings="openSettings" />

    <!-- API Settings Modal -->
    <ApiSettings
      v-if="showApiSettings"
      @close="closeSettings"
      @saved="closeSettings"
    />

    <!-- Main Content - Router View -->
    <main>
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="mt-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('app.footer') }}
        </p>
      </div>
    </footer>

    <!-- AI Chat Assistant (floating) -->
    <ChatAssistant @open-settings="openSettings" />
  </div>
</template>

<style scoped>
/* Additional component-specific styles if needed */
</style>

