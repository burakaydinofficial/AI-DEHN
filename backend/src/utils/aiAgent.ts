import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { AIPrompt, AIResponse, ChatMessage, ChatSession, AIAgentConfig } from '../types/api';

export class AIAgent {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: Required<AIAgentConfig>;

  constructor(config: AIAgentConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40,
      ...config
    };

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
        topP: this.config.topP,
        topK: this.config.topK,
      }
    });
  }

  /**
   * Generate content with specific generation configuration
   */
  async generateContent(prompt: string, config?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<{ text: string }> {
    try {
      // Create temporary model with custom config if provided
      let modelToUse = this.model;
      if (config?.model && config.model !== this.config.model) {
        modelToUse = this.genAI.getGenerativeModel({ 
          model: config.model,
          generationConfig: {
            temperature: config.temperature ?? this.config.temperature,
            maxOutputTokens: config.maxOutputTokens ?? this.config.maxOutputTokens,
            topP: this.config.topP,
            topK: this.config.topK,
          }
        });
      } else if (config?.temperature !== undefined || config?.maxOutputTokens !== undefined) {
        modelToUse = this.genAI.getGenerativeModel({ 
          model: this.config.model,
          generationConfig: {
            temperature: config.temperature ?? this.config.temperature,
            maxOutputTokens: config.maxOutputTokens ?? this.config.maxOutputTokens,
            topP: this.config.topP,
            topK: this.config.topK,
          }
        });
      }
      
      const result = await modelToUse.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { text };
    } catch (error) {
      throw new Error(`AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a response to a single prompt
   */
  async generateResponse(prompt: string, context?: string): Promise<AIResponse> {
    try {
      const fullPrompt = context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt;
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        id: this.generateId(),
        text,
        model: this.config.model,
        usage: {
          promptTokens: await this.model.countTokens(fullPrompt).then(r => r.totalTokens),
          completionTokens: await this.model.countTokens(text).then(r => r.totalTokens),
          totalTokens: 0 // Will be calculated
        },
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        createdAt: new Date()
      };
    } catch (error) {
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start a chat session
   */
  async startChatSession(systemPrompt?: string): Promise<ChatSession> {
    const sessionId = this.generateId();
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({
        id: this.generateId(),
        role: 'system',
        content: systemPrompt,
        timestamp: new Date()
      });
    }

    return {
      id: sessionId,
      userId: '', // Will be set by calling service
      title: 'New Chat Session',
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Continue a chat session with a new message
   */
  async continueChat(session: ChatSession, userMessage: string): Promise<{
    session: ChatSession;
    response: AIResponse;
  }> {
    try {
      // Add user message to session
      const userMsg: ChatMessage = {
        id: this.generateId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      session.messages.push(userMsg);

      // Prepare chat history for the model
      const chat = this.model.startChat({
        history: session.messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.content }]
          }))
      });

      // Generate response
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      // Create AI response object
      const aiResponse: AIResponse = {
        id: this.generateId(),
        text,
        model: this.config.model,
        usage: {
          promptTokens: await this.model.countTokens(userMessage).then(r => r.totalTokens),
          completionTokens: await this.model.countTokens(text).then(r => r.totalTokens),
          totalTokens: 0
        },
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        createdAt: new Date()
      };

      // Add assistant message to session
      const assistantMsg: ChatMessage = {
        id: aiResponse.id,
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };

      session.messages.push(assistantMsg);
      session.updatedAt = new Date();

      return {
        session,
        response: aiResponse
      };
    } catch (error) {
      throw new Error(`Chat continuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze document content
   */
  async analyzeDocument(content: string, prompt?: string): Promise<AIResponse> {
    const defaultPrompt = "Please analyze this document and provide a summary of its key points, themes, and any important insights.";
    const analysisPrompt = prompt || defaultPrompt;
    
    const fullPrompt = `Document Content:\n${content}\n\nAnalysis Request: ${analysisPrompt}`;
    
    return this.generateResponse(fullPrompt);
  }

  /**
   * Extract insights from PDF content
   */
  async extractInsights(content: string, specificQuestions?: string[]): Promise<AIResponse> {
    let prompt = "Please extract key insights, important information, and main themes from this document.";
    
    if (specificQuestions && specificQuestions.length > 0) {
      prompt += "\n\nPlease specifically address these questions:\n" + 
                specificQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    }

    return this.generateResponse(prompt, content);
  }

  /**
   * Summarize document content
   */
  async summarizeDocument(content: string, maxLength?: 'brief' | 'detailed'): Promise<AIResponse> {
    const lengthInstruction = maxLength === 'brief' 
      ? "Please provide a brief summary (2-3 paragraphs)" 
      : "Please provide a detailed summary";
    
    const prompt = `${lengthInstruction} of the following document:\n\n${content}`;
    
    return this.generateResponse(prompt);
  }

  /**
   * Generate questions based on document content
   */
  async generateQuestions(content: string, questionType?: 'comprehension' | 'analytical' | 'discussion'): Promise<AIResponse> {
    const typeInstruction = {
      comprehension: "comprehension questions that test understanding of the main points",
      analytical: "analytical questions that require deeper thinking and analysis",
      discussion: "discussion questions that promote conversation and debate"
    }[questionType || 'comprehension'];

    const prompt = `Based on this document, generate 5-7 ${typeInstruction}:\n\n${content}`;
    
    return this.generateResponse(prompt);
  }

  /**
   * Compare multiple documents
   */
  async compareDocuments(documents: { title: string; content: string }[]): Promise<AIResponse> {
    const documentTexts = documents.map((doc, i) => 
      `Document ${i + 1} (${doc.title}):\n${doc.content}`
    ).join('\n\n---\n\n');

    const prompt = `Please compare and contrast these documents, identifying similarities, differences, and relationships between them:\n\n${documentTexts}`;
    
    return this.generateResponse(prompt);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
