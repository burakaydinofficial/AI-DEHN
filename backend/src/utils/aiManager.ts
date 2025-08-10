/**
 * Centralized AIAgent management
 * Provides singleton instance and factory methods for AIAgent
 */

import { AIAgent } from './aiAgent';
import { appConfig } from '../config';
import type { AIAgentConfig } from '../types/api';

class AIAgentManager {
  private static instance: AIAgent | null = null;
  private static isInitialized = false;

  /**
   * Get the singleton AIAgent instance
   */
  static getInstance(): AIAgent {
    if (!this.instance) {
      this.instance = this.createAIAgent();
      this.isInitialized = true;
    }
    return this.instance;
  }

  /**
   * Create a new AIAgent with custom configuration
   */
  static createAIAgent(customConfig?: Partial<AIAgentConfig>): AIAgent {
    if (!appConfig.ai.apiKey && !customConfig?.apiKey) {
      console.warn('⚠️  No AI API key available. Creating AIAgent with mock configuration.');
      return new AIAgent({
        apiKey: 'mock-api-key',
        model: appConfig.ai.model,
        temperature: appConfig.ai.temperature,
        maxOutputTokens: appConfig.ai.maxOutputTokens,
        topP: appConfig.ai.topP,
        topK: appConfig.ai.topK,
        ...customConfig
      });
    }

    const config: AIAgentConfig = {
      apiKey: appConfig.ai.apiKey!,
      model: appConfig.ai.model,
      temperature: appConfig.ai.temperature,
      maxOutputTokens: appConfig.ai.maxOutputTokens,
      topP: appConfig.ai.topP,
      topK: appConfig.ai.topK,
      ...customConfig
    };

    return new AIAgent(config);
  }

  /**
   * Check if AI features are available
   */
  static isAIAvailable(): boolean {
    return !!appConfig.ai.apiKey;
  }

  /**
   * Get AI configuration summary
   */
  static getConfigSummary() {
    return {
      model: appConfig.ai.model,
      hasApiKey: !!appConfig.ai.apiKey,
      temperature: appConfig.ai.temperature,
      maxOutputTokens: appConfig.ai.maxOutputTokens,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    this.isInitialized = false;
  }

  /**
   * Initialize AI with custom API key at runtime
   */
  static initializeWithApiKey(apiKey: string, customConfig?: Partial<Omit<AIAgentConfig, 'apiKey'>>): AIAgent {
    const config: AIAgentConfig = {
      apiKey,
      model: appConfig.ai.model,
      temperature: appConfig.ai.temperature,
      maxOutputTokens: appConfig.ai.maxOutputTokens,
      topP: appConfig.ai.topP,
      topK: appConfig.ai.topK,
      ...customConfig
    };

    this.instance = new AIAgent(config);
    this.isInitialized = true;
    
    console.log('✅ AIAgent initialized with provided API key');
    return this.instance;
  }
}

// Export the singleton instance getter as default
export const getAIAgent = () => AIAgentManager.getInstance();

// Export the manager for advanced usage
export { AIAgentManager };

// Export configuration checker
export const isAIEnabled = () => AIAgentManager.isAIAvailable();
