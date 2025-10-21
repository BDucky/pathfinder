/**
 * Test script to list available Gemini models
 * Run this locally to see what models are available with your API key
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

async function listModels() {
  const apiKey = 'AIzaSyCNV3SR_Be9KsTjo7nC97ep_pLluL3m6fw'
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables')
    console.log('Set it like: GEMINI_API_KEY=your_key_here node api/test-models.js')
    process.exit(1)
  }

  console.log('🔍 Testing Gemini API...')
  console.log('API Key length:', apiKey.length)
  console.log('API Key prefix:', apiKey.substring(0, 10) + '...')
  
  const genAI = new GoogleGenerativeAI(apiKey)
  
  try {
    console.log('\n📋 Listing available models...\n')
    const models = await genAI.listModels()
    
    console.log(`Found ${models.length} models:\n`)
    
    for (const model of models) {
      console.log(`✅ ${model.name}`)
      console.log(`   Display Name: ${model.displayName}`)
      console.log(`   Description: ${model.description}`)
      console.log(`   Supported: ${model.supportedGenerationMethods?.join(', ')}`)
      console.log('')
    }
    
    // Try the most common model names
    const modelsToTest = [
      'gemini-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-flash-latest',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ]
    
    console.log('\n🧪 Testing specific model names...\n')
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Say "Hello"')
        const response = await result.response
        const text = response.text()
        console.log(`✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}`)
      } catch (error) {
        console.log(`❌ ${modelName} - FAILED: ${error.message.substring(0, 100)}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

listModels()
