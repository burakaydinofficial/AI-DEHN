import { Router, Request, Response, NextFunction } from 'express';
import { AIAgent } from '../utils/aiAgent';
import { 
  AIChatRequest, 
  AIAnalyzeDocumentRequest, 
  ApiResponse, 
  ChatSession,
  AIResponse 
} from '../types';

export const aiRouter = Router();

// Initialize AI agent
const aiAgent = new AIAgent({
  apiKey: process.env.AI_API_KEY || 'mock-api-key'
});

// Mock chat sessions storage
const mockSessions: ChatSession[] = [];

// Start new chat session
aiRouter.post('/chat/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemPrompt } = req.body;
    
    const session = await aiAgent.startChatSession(systemPrompt);
    session.userId = '1'; // Mock user ID
    
    mockSessions.push(session);

    res.json({
      success: true,
      data: session,
      message: 'Chat session started successfully',
      timestamp: new Date()
    } as ApiResponse<ChatSession>);
  } catch (error) {
    next(error);
  }
});

// Continue chat conversation
aiRouter.post('/chat/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message }: AIChatRequest = req.body;
    const sessionId = req.params.sessionId;

    const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    const session = mockSessions[sessionIndex];
    const result = await aiAgent.continueChat(session, message);
    
    mockSessions[sessionIndex] = result.session;

    res.json({
      success: true,
      data: {
        session: result.session,
        response: result.response
      },
      timestamp: new Date()
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// Get chat sessions
aiRouter.get('/chat/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Filter by user ID in real implementation
    const userSessions = mockSessions.filter(s => s.userId === '1');

    res.json({
      success: true,
      data: userSessions,
      timestamp: new Date()
    } as ApiResponse<ChatSession[]>);
  } catch (error) {
    next(error);
  }
});

// Analyze document with AI
aiRouter.post('/analyze-document', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId, prompt, includeContent }: AIAnalyzeDocumentRequest = req.body;

    // Mock document content retrieval
    const documentContent = "Sample document content for analysis...";

    const response = await aiAgent.analyzeDocument(documentContent, prompt);

    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    } as ApiResponse<AIResponse>);
  } catch (error) {
    next(error);
  }
});

// Generate insights from text
aiRouter.post('/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, questions } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        timestamp: new Date()
      } as ApiResponse);
    }

    const response = await aiAgent.extractInsights(content, questions);

    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    } as ApiResponse<AIResponse>);
  } catch (error) {
    next(error);
  }
});

// Summarize text
aiRouter.post('/summarize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, maxLength } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        timestamp: new Date()
      } as ApiResponse);
    }

    const response = await aiAgent.summarizeDocument(content, maxLength);

    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    } as ApiResponse<AIResponse>);
  } catch (error) {
    next(error);
  }
});

// Generate questions
aiRouter.post('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, questionType } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        timestamp: new Date()
      } as ApiResponse);
    }

    const response = await aiAgent.generateQuestions(content, questionType);

    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    } as ApiResponse<AIResponse>);
  } catch (error) {
    next(error);
  }
});
