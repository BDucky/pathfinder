import { defineStore } from 'pinia'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { getActiveMode, apiRequest } from '../config/api'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    isTyping: false,
    error: null,
    aiProvider: 'gemini', // 'gemini' or 'groq'
    chatSession: null, // For Gemini chat history
  }),

  actions: {
    /**
     * Initialize chat with system prompt based on learning path
     */
    initializeChat(learningPath) {
      const systemPrompt = this.generateSystemPrompt(learningPath)
      
      // Clear previous messages and start fresh
      this.messages = [
        {
          id: Date.now(),
          role: 'assistant',
          content: `Xin chào! 👋 Tôi là trợ lý học tập AI của bạn. Tôi sẽ đồng hành cùng bạn trong lộ trình học **${learningPath?.topic || 'của bạn'}**.

Tôi có thể giúp bạn:
📚 Giải thích khái niệm và thuật ngữ
💡 Gợi ý bài tập thực hành
🎯 Đánh giá tiến độ học tập
🔍 Tóm tắt nội dung video
❓ Trả lời các câu hỏi về chủ đề đang học

Hãy hỏi tôi bất cứ điều gì bạn cần! 😊`,
          timestamp: new Date().toISOString()
        }
      ]

      // Store system context for AI
      this.systemContext = systemPrompt
      this.learningPathContext = learningPath
    },

    /**
     * Generate system prompt with learning path context
     */
    generateSystemPrompt(learningPath) {
      if (!learningPath) {
        return `Bạn là một trợ lý học tập AI thân thiện và chuyên nghiệp. 
Nhiệm vụ của bạn là hỗ trợ học viên trong quá trình học tập, giải đáp thắc mắc, 
và đưa ra lời khuyên hữu ích. Hãy trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.`
      }

      const currentWeek = learningPath.weeks?.find(w => !w.completed)
      const completedWeeks = learningPath.weeks?.filter(w => w.completed) || []
      
      return `Bạn là một trợ lý học tập AI chuyên nghiệp, đang hỗ trợ học viên trong lộ trình học tập cá nhân hóa.

## Thông tin lộ trình học tập:
- **Chủ đề**: ${learningPath.topic}
- **Trình độ**: ${learningPath.level}
- **Tổng thời gian**: ${learningPath.totalWeeks} tuần
- **Giờ học mỗi tuần**: ${learningPath.hoursPerWeek} giờ
- **Tiến độ hiện tại**: ${completedWeeks.length}/${learningPath.weeks?.length || 0} tuần đã hoàn thành

${currentWeek ? `## Tuần hiện tại (Tuần ${currentWeek.weekNumber}): ${currentWeek.title}
**Mục tiêu**:
${currentWeek.objectives?.map(obj => `- ${obj}`).join('\n')}

**Chủ đề học**:
${currentWeek.topics?.map(topic => `- ${topic}`).join('\n')}` : ''}

## Vai trò của bạn:
1. Giải thích khái niệm và thuật ngữ liên quan đến ${learningPath.topic}
2. Đưa ra ví dụ thực tế và dễ hiểu
3. Gợi ý bài tập và dự án thực hành phù hợp với trình độ ${learningPath.level}
4. Đánh giá tiến độ và động viên học viên
5. Trả lời câu hỏi về nội dung đang học
6. Tóm tắt video và tài liệu học tập

## Nguyên tắc giao tiếp:
- Trả lời bằng tiếng Việt
- Ngắn gọn, súc tích (3-5 câu trừ khi cần giải thích chi tiết)
- Sử dụng emoji phù hợp để tăng tính thân thiện
- Khuyến khích học viên thực hành và đặt câu hỏi
- Đưa ra ví dụ code khi cần thiết (với syntax highlighting)

Hãy trở thành người đồng hành tuyệt vời nhất cho học viên!`
    },

    /**
     * Send message to AI and get response
     * Supports both backend API and client-side mode
     */
    async sendMessage(userMessage) {
      if (!userMessage.trim()) return

      // Add user message
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      }
      this.messages.push(userMsg)

      this.isTyping = true
      this.error = null

      try {
        const mode = getActiveMode()
        let aiResponse

        if (mode === 'backend') {
          // Use backend API
          const conversationHistory = this.messages
            .slice(0, -1) // Exclude the message we just added
            .filter(m => !m.isError)
            .map(m => ({ role: m.role, content: m.content }))

          const result = await apiRequest('/chat', {
            message: userMessage,
            provider: this.aiProvider,
            systemContext: this.systemContext,
            conversationHistory
          })

          aiResponse = result.response

        } else {
          // Use client-side API keys
          if (this.aiProvider === 'gemini') {
            aiResponse = await this.sendToGemini(userMessage)
          } else if (this.aiProvider === 'groq') {
            aiResponse = await this.sendToGroq(userMessage)
          } else {
            throw new Error('Invalid AI provider selected')
          }
        }

        // Add AI response
        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        }
        this.messages.push(assistantMsg)

        // Save to localStorage
        this.saveMessages()

      } catch (error) {
        console.error('Chat error:', error)
        this.error = error.message || 'Đã xảy ra lỗi khi giao tiếp với AI'
        
        // Add error message
        this.messages.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: `❌ Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu: ${this.error}\n\nVui lòng kiểm tra cấu hình hoặc thử lại sau.`,
          timestamp: new Date().toISOString(),
          isError: true
        })
      } finally {
        this.isTyping = false
      }
    },

    /**
     * Send message to Google Gemini API
     */
    async sendToGemini(message) {
      const apiKey = localStorage.getItem('gemini_api_key')
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please configure it in settings.')
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-pro',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })

      // Initialize chat with history if not exists
      if (!this.chatSession) {
        this.chatSession = model.startChat({
          history: this.convertMessagesToGeminiHistory(),
          generationConfig: {
            maxOutputTokens: 1024,
          },
        })
      }

      // Send message with system context
      const contextualMessage = `${this.systemContext}\n\n---\n\nHọc viên hỏi: ${message}`
      const result = await this.chatSession.sendMessage(contextualMessage)
      const response = await result.response
      return response.text()
    },

    /**
     * Send message to Groq API
     */
    async sendToGroq(message) {
      const apiKey = localStorage.getItem('groq_api_key')
      if (!apiKey) {
        throw new Error('Groq API key not found. Please configure it in settings.')
      }

      const groq = new Groq({ 
        apiKey,
        dangerouslyAllowBrowser: true // Enable browser usage
      })

      // Build conversation history
      const messages = [
        {
          role: 'system',
          content: this.systemContext || 'Bạn là một trợ lý học tập AI thân thiện.'
        },
        ...this.convertMessagesToGroqHistory(),
        {
          role: 'user',
          content: message
        }
      ]

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.1-8b-instant', // Fast and powerful
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })

      return chatCompletion.choices[0]?.message?.content || 'No response'
    },

    /**
     * Convert messages to Gemini chat history format
     */
    convertMessagesToGeminiHistory() {
      // Only include recent messages (last 10) to avoid token limits
      const recentMessages = this.messages.slice(-10).filter(m => !m.isError && m.role !== 'system')
      
      return recentMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    },

    /**
     * Convert messages to Groq chat history format
     */
    convertMessagesToGroqHistory() {
      // Only include recent messages (last 10) to avoid token limits
      const recentMessages = this.messages.slice(-10).filter(m => !m.isError && m.role !== 'system')
      
      return recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    },

    /**
     * Switch AI provider
     */
    switchProvider(provider) {
      if (provider !== 'gemini' && provider !== 'groq') {
        console.error('Invalid provider:', provider)
        return
      }

      this.aiProvider = provider
      this.chatSession = null // Reset chat session when switching

      // Save preference
      localStorage.setItem('preferred_ai_provider', provider)
    },

    /**
     * Clear chat history
     */
    clearChat() {
      this.messages = []
      this.chatSession = null
      this.error = null
      localStorage.removeItem('chat_messages')
    },

    /**
     * Save messages to localStorage
     */
    saveMessages() {
      try {
        localStorage.setItem('chat_messages', JSON.stringify(this.messages))
      } catch (error) {
        console.error('Failed to save chat messages:', error)
      }
    },

    /**
     * Load messages from localStorage
     */
    loadMessages() {
      try {
        const saved = localStorage.getItem('chat_messages')
        if (saved) {
          this.messages = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error)
      }
    },

    /**
     * Load AI provider preference
     */
    loadProviderPreference() {
      const saved = localStorage.getItem('preferred_ai_provider')
      if (saved && (saved === 'gemini' || saved === 'groq')) {
        this.aiProvider = saved
      }
    }
  },

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    messageCount: (state) => state.messages.length,
    lastMessage: (state) => state.messages[state.messages.length - 1] || null
  }
})

