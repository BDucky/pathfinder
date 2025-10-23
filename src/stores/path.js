import { defineStore } from 'pinia'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { getActiveMode, apiRequest } from '../config/api'

export const usePathStore = defineStore('path', {
  state: () => ({
    learningPaths: [], // This will hold all paths
    activePath: null,  // This will be the path currently being viewed
    isGenerating: false,
    error: null,
    currentStep: '',
    progress: 0
  }),

  actions: {
    async generateLearningPath({ topic, level, duration, hoursPerWeek }) {
      this.isGenerating = true
      this.error = null
      this.progress = 0

      try {
        const mode = getActiveMode()
        if (!mode) throw new Error('API not configured. Please configure API keys in settings.')

        this.currentStep = 'Generating learning path structure...'
        this.progress = 20

        let pathStructure
        if (mode === 'backend') {
          pathStructure = await apiRequest('/generate-path', { topic, level, duration, hoursPerWeek })
        } else {
          const geminiApiKey = localStorage.getItem('gemini_api_key')
          if (!geminiApiKey) throw new Error('Gemini API key is missing.')
          pathStructure = await this.generatePathStructure(geminiApiKey, topic, level, duration, hoursPerWeek)
        }

        this.progress = 50
        this.currentStep = 'Fetching learning resources...'

        const pathWithResources = await this.fetchResourcesForPath(pathStructure, mode)

        this.progress = 90
        this.currentStep = 'Finalizing...'

        const finalPath = {
          ...pathWithResources,
          id: Date.now(), // Simple unique ID
          createdAt: new Date().toISOString()
        }

        this.addPath(finalPath)
        this.setActivePath(finalPath.id)

        this.progress = 100
        this.currentStep = 'Learning path created successfully!'
        return finalPath // Return the created path

      } catch (error) {
        console.error('Error generating learning path:', error)
        this.error = error.message || 'An error occurred while generating the learning path.'
        return null // Return null on failure
      } finally {
        this.isGenerating = false
        setTimeout(() => {
          this.currentStep = ''
          this.progress = 0
        }, 2000)
      }
    },

    async generatePathStructure(apiKey, topic, level, duration, hoursPerWeek) {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' })
      const prompt = `Create a ${duration}-week learning path for "${topic}" at ${level} level (${hoursPerWeek} hours/week). Return ONLY valid JSON.`
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      try {
        return JSON.parse(text)
      } catch (parseError) {
        console.error('Failed to parse AI response:', text)
        throw new Error('AI returned invalid JSON format. Please try again.')
      }
    },

    async fetchResourcesForPath(pathStructure, mode) {
      const weeksWithResources = await Promise.all(
        pathStructure.weeks.map(async (week) => {
          let videos = []
          try {
            if (mode === 'backend') {
              videos = await apiRequest('/youtube', { keywords: week.searchKeywords, maxResults: 3 })
            } else {
              const youtubeApiKey = localStorage.getItem('youtube_api_key')
              if (youtubeApiKey) {
                videos = await this.searchYouTubeVideos(youtubeApiKey, week.searchKeywords, 3)
              }
            }
          } catch (error) {
            console.error(`Failed to fetch YouTube videos for week ${week.weekNumber}:`, error)
          }
          return { ...week, resources: videos, completed: false }
        })
      )
      return { ...pathStructure, weeks: weeksWithResources }
    },

    async searchYouTubeVideos(apiKey, keywords, maxResults = 3) {
      const searchQuery = keywords.join(' ')
      const url = 'https://www.googleapis.com/youtube/v3/search'
      try {
        const response = await axios.get(url, { params: { key: apiKey, q: searchQuery, part: 'snippet', type: 'video', maxResults } })
        return response.data.items.map(item => ({ id: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium.url, channelTitle: item.snippet.channelTitle, url: `https://www.youtube.com/watch?v=${item.id.videoId}` }))
      } catch (error) {
        console.error('YouTube API error:', error)
        return []
      }
    },

    // --- CRUD Actions for Multiple Paths ---
    addPath(path) {
      this.learningPaths.push(path)
      this.savePathsToStorage()
    },

    deletePath(pathId) {
      this.learningPaths = this.learningPaths.filter(p => p.id !== pathId)
      if (this.activePath?.id === pathId) {
        this.activePath = null
      }
      this.savePathsToStorage()
    },

    setActivePath(pathId) {
      this.activePath = this.learningPaths.find(p => p.id == pathId) || null
    },

    toggleWeekCompletion(pathId, weekNumber) {
      const path = this.learningPaths.find(p => p.id == pathId)
      if (path) {
        const week = path.weeks.find(w => w.weekNumber === weekNumber)
        if (week) {
          week.completed = !week.completed
          this.savePathsToStorage()
        }
      }
    },

    savePathsToStorage() {
      try {
        localStorage.setItem('learning_paths_list', JSON.stringify(this.learningPaths))
      } catch (error) {
        console.error('Failed to save paths to localStorage:', error)
      }
    },

    loadPathsFromStorage() {
      try {
        const saved = localStorage.getItem('learning_paths_list')
        if (saved) {
          this.learningPaths = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Failed to load paths from localStorage:', error)
      }
    }
  },

  getters: {
    hasPaths: (state) => state.learningPaths.length > 0,
    completedPathsCount: (state) => state.learningPaths.filter(p => p.weeks.every(w => w.completed)).length,
    inProgressPathsCount: (state) => state.learningPaths.filter(p => !p.weeks.every(w => w.completed) && p.weeks.some(w => w.completed)).length,
    activePathProgress: (state) => {
      if (!state.activePath?.weeks) return 0
      const total = state.activePath.weeks.length
      if (total === 0) return 0
      const completed = state.activePath.weeks.filter(w => w.completed).length
      return Math.round((completed / total) * 100)
    }
  }
})

