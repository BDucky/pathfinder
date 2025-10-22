<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useLanguage } from '../composables/useLanguage'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()
const { locale, toggleLanguage, t } = useLanguage()

const showSettings = ref(false)

function navigateTo(path) {
  router.push(path)
}

function isActive(path) {
  return route.path === path
}

const emit = defineEmits(['openSettings'])

function openSettings() {
  emit('openSettings')
}
</script>

<template>
  <header class="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Title -->
        <div class="flex items-center cursor-pointer" @click="navigateTo('/dashboard')">
          <h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            🎯 {{ t('app.title') }}
          </h1>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center space-x-1">
          <button
            @click="navigateTo('/dashboard')"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="{
              'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300': isActive('/dashboard'),
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isActive('/dashboard')
            }"
          >
            📊 {{ t('nav.dashboard') }}
          </button>
          <button
            @click="navigateTo('/create')"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="{
              'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300': isActive('/create'),
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isActive('/create')
            }"
          >
            ➕ {{ t('nav.create') }}
          </button>
        </nav>

        <!-- Right Actions -->
        <div class="flex items-center space-x-2">
          <!-- Language Toggle -->
          <button
            @click="toggleLanguage"
            class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="t('nav.language')"
          >
            <span class="text-xl">{{ locale === 'en' ? '🇬🇧' : '🇻🇳' }}</span>
          </button>

          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="t('nav.theme')"
          >
            <span class="text-xl">{{ isDark ? '🌙' : '☀️' }}</span>
          </button>

          <!-- Settings -->
          <button
            @click="openSettings"
            class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="t('nav.settings')"
          >
            <span class="text-xl">⚙️</span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div class="md:hidden pb-3 pt-1 space-x-1">
        <button
          @click="navigateTo('/dashboard')"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="{
            'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300': isActive('/dashboard'),
            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isActive('/dashboard')
          }"
        >
          📊 {{ t('nav.dashboard') }}
        </button>
        <button
          @click="navigateTo('/create')"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="{
            'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300': isActive('/create'),
            'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isActive('/create')
          }"
        >
          ➕ {{ t('nav.create') }}
        </button>
      </div>
    </div>
  </header>
</template>
