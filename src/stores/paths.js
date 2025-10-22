import { defineStore } from 'pinia'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { getActiveMode, apiRequest } from '../config/api'

export const usePathsStore = defineStore('paths', {
  state: () => ({
    paths: [], // Array of all learning paths
    currentPath: null, // Currently viewing/editing path
    isGenerating: false,
    error: null,
    currentStep: '',
    progress: 0
  }),

  actions: {
    /**
     * Generate a new learning path
     */
    async generateLearningPath({ topic, level, duration, hoursPerWeek }) {
      this.isGenerating = true
      this.error = null
      this.progress = 0

      try {
        const mode = getActiveMode()
        
        if (!mode) {
          throw new Error('API not configured. Please configure API keys in settings.')
        }

        // Step 1: Generate learning path structure
        this.currentStep = 'Creating learning path structure...'
        this.progress = 20

        let pathStructure
        
        if (mode === 'backend') {
          // Use backend API
          pathStructure = await apiRequest('/generate-path', {
            topic,
            level,
            duration,
            hoursPerWeek
          })
        } else {
          // Use client-side API keys
          const geminiApiKey = localStorage.getItem('gemini_api_key')
          if (!geminiApiKey) {
            throw new Error('Gemini API key is missing.')
          }
          
          pathStructure = await this.generatePathStructure(
            geminiApiKey,
            topic,
            level,
            duration,
            hoursPerWeek
          )
        }

        this.progress = 50
        this.currentStep = 'Searching for learning resources...'

        // Step 2: Fetch resources (YouTube videos) for each week
        const pathWithResources = await this.fetchResourcesForPath(
          pathStructure,
          mode
        )

        this.progress = 90
        this.currentStep = 'Finalizing...'

        // Step 3: Create path object with metadata
        const newPath = {
          id: Date.now().toString(),
          ...pathWithResources,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedWeeks: [],
          status: 'active' // active, completed, archived
        }

        // Add to paths array
        this.paths.push(newPath)
        this.currentPath = newPath
        this.savePaths()

        this.progress = 100
        this.currentStep = 'Learning path created successfully!'

        return newPath

      } catch (error) {
        console.error('Error generating learning path:', error)
        
        // Extract user-friendly error message
        let errorMessage = 'An error occurred while generating the learning path.'
        
        if (error.message) {
          if (error.message.includes('invalid format') || error.message.includes('AI returned')) {
            errorMessage = 'AI generated an invalid response. Please try again with different parameters.'
          } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
            errorMessage = 'Request timed out. Try reducing the number of weeks or hours per week.'
          } else if (error.message.includes('quota') || error.message.includes('429')) {
            errorMessage = 'API quota exceeded. Please try again later.'
          } else if (error.message.includes('API key')) {
            errorMessage = 'API key error. Please check your settings.'
          } else {
            errorMessage = error.message
          }
        }
        
        this.error = errorMessage
        this.currentStep = `Error: ${errorMessage}`
        throw error
      } finally {
        this.isGenerating = false
        // Don't clear error immediately if there was an error
        if (!this.error) {
          setTimeout(() => {
            this.currentStep = ''
            this.progress = 0
          }, 2000)
        }
      }
    },

    /**
     * Uses Gemini AI to generate learning path structure (Client-side)
     */
    async generatePathStructure(apiKey, topic, level, duration, hoursPerWeek) {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: 'models/gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })

      const prompt = `Create a ${duration}-week learning path for "${topic}" at ${level} level (${hoursPerWeek} hours/week).

Return ONLY valid JSON (no markdown, no explanations) with this structure:
{
  "title": "Learning path title",
  "topic": "${topic}",
  "level": "${level}",
  "totalWeeks": ${duration},
  "hoursPerWeek": ${hoursPerWeek},
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week title",
      "objectives": ["objective 1", "objective 2"],
      "topics": ["topic 1", "topic 2", "topic 3"],
      "estimatedHours": 10,
      "searchKeywords": ["keyword1 tutorial", "keyword2 beginner"],
      "exercises": "Practical exercise description"
    }
  ]
}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()

      // Clean up response - remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      const pathStructure = JSON.parse(text)
      return pathStructure
    },

    /**
     * Fetch YouTube resources for learning path
     */
    async fetchResourcesForPath(pathStructure, mode) {
      const pathWithResources = { ...pathStructure, weeks: [] }

      for (const week of pathStructure.weeks) {
        try {
          let videos = []
          
          if (mode === 'backend') {
            // Use backend YouTube API
            // YouTube API expects keywords as an array
            const keywords = week.searchKeywords || [week.title]
            videos = await apiRequest('/youtube', {
              keywords: keywords,
              maxResults: 3
            })
          } else {
            // Use client-side YouTube API
            const youtubeApiKey = localStorage.getItem('youtube_api_key')
            if (youtubeApiKey) {
              videos = await this.searchYouTubeVideos(
                week.searchKeywords?.[0] || week.title,
                youtubeApiKey
              )
            }
          }

          pathWithResources.weeks.push({
            ...week,
            resources: videos
          })
        } catch (error) {
          console.error(`Failed to fetch resources for week ${week.weekNumber}:`, error)
          pathWithResources.weeks.push({
            ...week,
            resources: []
          })
        }
      }

      return pathWithResources
    },

    /**
     * Search YouTube videos using API
     */
    async searchYouTubeVideos(searchQuery, apiKey, maxResults = 3) {
      const url = 'https://www.googleapis.com/youtube/v3/search'

      try {
        const response = await axios.get(url, {
          params: {
            key: apiKey,
            q: searchQuery,
            part: 'snippet',
            type: 'video',
            maxResults: maxResults,
            videoDuration: 'medium',
            relevanceLanguage: 'en',
            safeSearch: 'strict'
          }
        })

        return response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }))
      } catch (error) {
        console.error('YouTube API error:', error)
        return []
      }
    },

    /**
     * Get path by ID
     */
    getPathById(id) {
      return this.paths.find(path => path.id === id)
    },

    /**
     * Set current path for viewing
     */
    setCurrentPath(id) {
      const path = this.getPathById(id)
      if (path) {
        this.currentPath = path
      }
    },

    /**
     * Delete a path
     */
    deletePath(id) {
      const index = this.paths.findIndex(path => path.id === id)
      if (index !== -1) {
        this.paths.splice(index, 1)
        if (this.currentPath?.id === id) {
          this.currentPath = null
        }
        this.savePaths()
      }
    },

    /**
     * Toggle week completion for a specific path
     */
    toggleWeekCompletion(pathId, weekNumber) {
      const path = this.getPathById(pathId)
      if (!path) return

      const weekIndex = path.completedWeeks.indexOf(weekNumber)
      if (weekIndex === -1) {
        path.completedWeeks.push(weekNumber)
      } else {
        path.completedWeeks.splice(weekIndex, 1)
      }

      path.updatedAt = new Date().toISOString()
      this.savePaths()
    },

    /**
     * Update path status
     */
    updatePathStatus(pathId, status) {
      const path = this.getPathById(pathId)
      if (path) {
        path.status = status
        path.updatedAt = new Date().toISOString()
        this.savePaths()
      }
    },

    /**
     * Save all paths to localStorage
     */
    savePaths() {
      try {
        localStorage.setItem('learning_paths', JSON.stringify(this.paths))
      } catch (error) {
        console.error('Failed to save paths:', error)
      }
    },

    /**
     * Load all paths from localStorage
     */
    loadPaths() {
      try {
        const saved = localStorage.getItem('learning_paths')
        if (saved) {
          this.paths = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Failed to load paths:', error)
        this.paths = []
      }
    },

    /**
     * Clear all paths
     */
    clearAllPaths() {
      this.paths = []
      this.currentPath = null
      localStorage.removeItem('learning_paths')
    }
  },

  getters: {
    /**
     * Get active paths
     */
    activePaths: (state) => {
      return state.paths.filter(path => path.status === 'active')
    },

    /**
     * Get completed paths
     */
    completedPaths: (state) => {
      return state.paths.filter(path => path.status === 'completed')
    },

    /**
     * Get progress percentage for a path
     */
    getPathProgress: (state) => (pathId) => {
      const path = state.paths.find(p => p.id === pathId)
      if (!path || !path.weeks) return 0
      
      const total = path.weeks.length
      const completed = path.completedWeeks.length
      
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },

    /**
     * Check if path is completed
     */
    isPathCompleted: (state) => (pathId) => {
      const path = state.paths.find(p => p.id === pathId)
      if (!path || !path.weeks) return false
      
      return path.completedWeeks.length === path.weeks.length
    }
  }
})
