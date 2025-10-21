import { defineStore } from 'pinia'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { getActiveMode, apiRequest } from '../config/api'

export const usePathStore = defineStore('path', {
  state: () => ({
    learningPath: null,
    isGenerating: false,
    error: null,
    currentStep: '',
    progress: 0
  }),

  actions: {
    /**
     * Main AI Agent Logic - Generates personalized learning path
     * Supports both backend API and client-side mode
     */
    async generateLearningPath({ topic, level, duration, hoursPerWeek }) {
      this.isGenerating = true
      this.error = null
      this.progress = 0
      this.learningPath = null

      try {
        const mode = getActiveMode()
        
        if (!mode) {
          throw new Error('API not configured. Please configure API keys in settings.')
        }

        // Step 1: Generate learning path structure
        this.currentStep = 'Đang tạo cấu trúc lộ trình học tập...'
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
        this.currentStep = 'Đang tìm kiếm tài nguyên học liệu...'

        // Step 2: Fetch resources (YouTube videos) for each week
        const pathWithResources = await this.fetchResourcesForPath(
          pathStructure,
          mode
        )

        this.progress = 90
        this.currentStep = 'Hoàn tất...'

        // Step 3: Save and update state
        this.learningPath = pathWithResources
        this.savePath(pathWithResources)

        this.progress = 100
        this.currentStep = 'Đã tạo lộ trình thành công!'

      } catch (error) {
        console.error('Error generating learning path:', error)
        this.error = error.message || 'An error occurred while generating the learning path.'
      } finally {
        this.isGenerating = false
        setTimeout(() => {
          this.currentStep = ''
          this.progress = 0
        }, 2000)
      }
    },

    /**
     * Uses Gemini AI to generate learning path structure
     */
    async generatePathStructure(apiKey, topic, level, duration, hoursPerWeek) {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'models/gemini-pro' })

      const prompt = `You are an expert learning path designer. Create a detailed, personalized learning roadmap.

Input:
- Topic: ${topic}
- Current Level: ${level}
- Duration: ${duration} weeks
- Hours per week: ${hoursPerWeek}

Create a structured learning path with the following requirements:
1. Break down the learning journey into ${duration} weeks
2. Each week should have:
   - Week number and title
   - Learning objectives (2-4 specific goals)
   - Topics to cover (3-5 subtopics)
   - Estimated hours needed
   - Search keywords for finding relevant videos (2-3 keywords optimized for YouTube search)
3. Progression should be logical and appropriate for the skill level
4. Include practical projects or exercises

Return ONLY a valid JSON object (no markdown, no code blocks) in this exact structure:
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

      try {
        const pathStructure = JSON.parse(text)
        return pathStructure
      } catch (parseError) {
        console.error('Failed to parse AI response:', text)
        throw new Error('AI returned invalid JSON format. Please try again.')
      }
    },

    /**
     * Fetches YouTube videos for each week's topics
     * Supports both backend API and client-side mode
     */
    async fetchResourcesForPath(pathStructure, mode) {
      const weeksWithResources = await Promise.all(
        pathStructure.weeks.map(async (week) => {
          let videos
          
          if (mode === 'backend') {
            // Use backend API
            try {
              videos = await apiRequest('/youtube', {
                keywords: week.searchKeywords,
                maxResults: 3
              })
            } catch (error) {
              console.error('YouTube API error:', error)
              videos = []
            }
          } else {
            // Use client-side API key
            const youtubeApiKey = localStorage.getItem('youtube_api_key')
            if (youtubeApiKey) {
              videos = await this.searchYouTubeVideos(
                youtubeApiKey,
                week.searchKeywords,
                3
              )
            } else {
              videos = []
            }
          }

          return {
            ...week,
            resources: videos,
            completed: false
          }
        })
      )

      return {
        ...pathStructure,
        weeks: weeksWithResources,
        createdAt: new Date().toISOString()
      }
    },

    /**
     * Searches YouTube for relevant educational videos
     */
    async searchYouTubeVideos(apiKey, keywords, maxResults = 3) {
      const searchQuery = keywords.join(' ')
      const url = 'https://www.googleapis.com/youtube/v3/search'

      try {
        const response = await axios.get(url, {
          params: {
            key: apiKey,
            q: searchQuery,
            part: 'snippet',
            type: 'video',
            maxResults: maxResults,
            videoDuration: 'medium', // 4-20 minutes
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
        // Return empty array if YouTube search fails - don't block the entire process
        return []
      }
    },

    /**
     * Saves learning path to localStorage
     */
    savePath(path) {
      try {
        localStorage.setItem('saved_learning_path', JSON.stringify(path))
      } catch (error) {
        console.error('Failed to save path:', error)
      }
    },

    /**
     * Loads saved learning path from localStorage
     */
    loadSavedPath() {
      try {
        const saved = localStorage.getItem('saved_learning_path')
        if (saved) {
          this.learningPath = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Failed to load saved path:', error)
      }
    },

    /**
     * Toggles completion status for a week
     */
    toggleWeekCompletion(weekNumber) {
      if (this.learningPath && this.learningPath.weeks) {
        const week = this.learningPath.weeks.find(w => w.weekNumber === weekNumber)
        if (week) {
          week.completed = !week.completed
          this.savePath(this.learningPath)
        }
      }
    },

    /**
     * Clears current learning path
     */
    clearPath() {
      this.learningPath = null
      localStorage.removeItem('saved_learning_path')
    }
  },

  getters: {
    hasPath: (state) => !!state.learningPath,
    completedWeeks: (state) => {
      if (!state.learningPath?.weeks) return 0
      return state.learningPath.weeks.filter(w => w.completed).length
    },
    totalWeeks: (state) => {
      return state.learningPath?.weeks?.length || 0
    },
    progressPercentage: (state) => {
      const total = state.learningPath?.weeks?.length || 0
      if (total === 0) return 0
      const completed = state.learningPath.weeks.filter(w => w.completed).length
      return Math.round((completed / total) * 100)
    }
  }
})

