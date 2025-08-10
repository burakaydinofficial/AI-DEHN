/**
 * Content Reduction Processor
 * AI-powered text grouping and language detection for multilingual PDFs
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  PDFAnalysisData, 
  ContentReductionResult, 
  ContentReductionGroup, 
  ProcessedTextBlock, 
  LanguageText, 
  AILogEntry,
  ChunksResult,
  MarkdownChunk
} from '../types/api';
import { 
  CONTENT_REDUCTION_CONFIG, 
  AI_PROCESSING_SETTINGS, 
  getAIConfig, 
  AIPromptConfig 
} from '../config/aiConfig';

/**
 * Main content reduction processor using standard configuration
 */
export async function performStandardContentReduction(
  analysisData: PDFAnalysisData,
  aiAgent: any,
  documentId: string
): Promise<ContentReductionResult> {
  const startTime = Date.now();
  const aiLogs: AILogEntry[] = [];

  // Extract text blocks from PDF analysis data
  const textBlocks = extractTextBlocks(analysisData);
  
  // Use our standard grouping algorithm
  const groups = await performStandardGrouping(textBlocks, aiAgent, aiLogs);
  
  // Detect languages in each group with high accuracy
  const groupsWithLanguages = await detectLanguagesInGroups(
    groups, 
    aiAgent, 
    AI_PROCESSING_SETTINGS.languageConfidenceThreshold, 
    textBlocks,
    aiLogs
  );
  
  // Get unique languages detected
  const languagesDetected = [...new Set(
    groupsWithLanguages.flatMap(group => 
      group.originalTexts.map(text => text.language)
    )
  )].filter(lang => lang !== 'unknown');

  return {
    groups: groupsWithLanguages,
    languagesDetected,
    totalGroups: groupsWithLanguages.length,
    processedAt: new Date(),
    aiLogs
  };
}

/**
 * Extract text blocks from PDF analysis data
 */
export function extractTextBlocks(analysisData: PDFAnalysisData): ProcessedTextBlock[] {
  const blocks: ProcessedTextBlock[] = [];
  
  if (analysisData.content?.pages) {
    for (const page of analysisData.content.pages) {
      if (page.text_blocks) {
        for (const block of page.text_blocks) {
          if (block.block_type === 'text' && block.lines?.length > 0) {
            // Extract text from spans within lines
            const blockText = block.lines
              .flatMap((line) => line.spans || [])
              .map((span) => span.text || '')
              .join(' ')
              .trim();
            
            if (blockText.length > AI_PROCESSING_SETTINGS.minTextLength) {
              blocks.push({
                text: blockText,
                bbox: block.bbox,
                pageNumber: page.page_number,
                lines: block.lines
              });
            }
          }
        }
      }
    }
  }
  
  return blocks;
}

/**
 * Standard grouping algorithm optimized for multilingual PDFs
 */
export // Helper function to extract JSON from AI responses that might be wrapped in markdown
function extractJsonFromResponse(responseText: string): any {
  try {
    // First, try to parse as direct JSON
    return JSON.parse(responseText);
  } catch {
    // If that fails, look for JSON wrapped in code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = responseText.match(codeBlockRegex);
    
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (error) {
        throw new Error(`Failed to parse JSON from code block: ${error}`);
      }
    }
    
    // If no code blocks found, try to find JSON-like content
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = responseText.match(jsonRegex);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        throw new Error(`Failed to parse extracted JSON: ${error}`);
      }
    }
    
    throw new Error(`No valid JSON found in response: ${responseText.substring(0, 200)}...`);
  }
}

async function performStandardGrouping(
  textBlocks: ProcessedTextBlock[],
  aiAgent: any,
  aiLogs: AILogEntry[]
): Promise<ContentReductionGroup[]> {
  
  const config = getAIConfig('textGrouping');
  const maxBlocks = Math.min(textBlocks.length, AI_PROCESSING_SETTINGS.maxTextBlocksPerRequest);
  
  const prompt = createGroupingPrompt(textBlocks.slice(0, maxBlocks));

  try {
    const response = await aiAgent.generateContent(prompt, {
      model: config.model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens
    });

    // Log the AI interaction for debugging
    if (AI_PROCESSING_SETTINGS.enableDetailedLogging) {
      aiLogs.push({
        timestamp: new Date(),
        phase: 'text-grouping',
        prompt: prompt.substring(0, AI_PROCESSING_SETTINGS.logPromptLength) + '...',
        response: response.text.substring(0, AI_PROCESSING_SETTINGS.logResponseLength) + '...',
        model: config.model
      });
    }

    const result = extractJsonFromResponse(response.text);
    const groupsData = result.groups || [];
    
    return groupsData.map((group: any, idx: number) => ({
      id: group.id || uuidv4(),
      type: group.type || 'other',
      originalTexts: [], // Will be populated with language detection
      bbox: calculateOverallBbox(group.blockIndices?.map((i: number) => textBlocks[i]) || []),
      pageNumber: textBlocks[group.blockIndices?.[0] || 0]?.pageNumber || 1,
      order: idx,
      _blockIndices: group.blockIndices || [],
      _confidence: group.confidence || AI_PROCESSING_SETTINGS.groupingConfidenceThreshold
    }));
    
  } catch (error) {
    console.error('AI grouping failed, using fallback:', error);
    aiLogs.push({
      timestamp: new Date(),
      phase: 'text-grouping-error',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: config.fallbackStrategy
    });
    
    // Fallback: simple position-based grouping
    return createFallbackGroups(textBlocks);
  }
}

/**
 * Detect languages in grouped text blocks
 */
export async function detectLanguagesInGroups(
  groups: ContentReductionGroup[],
  aiAgent: any,
  threshold: number,
  allBlocks: ProcessedTextBlock[],
  aiLogs: AILogEntry[]
): Promise<ContentReductionGroup[]> {
  const processedGroups: ContentReductionGroup[] = [];
  const config = getAIConfig('languageDetection');

  for (const group of groups) {
    const blockIndices = group._blockIndices || [];
    const groupTexts: LanguageText[] = [];

    for (const blockIdx of blockIndices) {
      const block = allBlocks[blockIdx];
      if (!block) continue;

      // Detect language for this text block
      const language = await detectLanguage(block.text, aiAgent, config, aiLogs);
      
      if (language) {
        groupTexts.push({
          language,
          text: block.text,
          bbox: block.bbox,
          confidence: threshold,
          isOriginal: true
        });
      }
    }

    if (groupTexts.length > 0) {
      processedGroups.push({
        id: group.id,
        type: group.type,
        originalTexts: groupTexts,
        bbox: group.bbox,
        pageNumber: group.pageNumber,
        order: group.order
      });
    }
  }

  return processedGroups;
}

/**
 * Detect language of text using AI with configuration
 */
export async function detectLanguage(
  text: string, 
  aiAgent: any, 
  config: AIPromptConfig,
  aiLogs: AILogEntry[]
): Promise<string | null> {
  if (!text || text.trim().length < AI_PROCESSING_SETTINGS.minBlockLength) return null;

  const prompt = createLanguageDetectionPrompt(text);

  try {
    const response = await aiAgent.generateContent(prompt, {
      model: config.model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens
    });

    const language = response.text.trim().toLowerCase();
    
    // Validate it's a reasonable language code
    if (/^[a-z]{2}$/.test(language) && language !== 'un') {
      return language;
    }
    
    return 'unknown';
  } catch (error) {
    if (AI_PROCESSING_SETTINGS.enableDetailedLogging) {
      aiLogs.push({
        timestamp: new Date(),
        phase: 'language-detection-error',
        error: error instanceof Error ? error.message : 'Language detection failed',
        fallback: 'unknown'
      });
    }
    return 'unknown';
  }
}

/**
 * Generate markdown chunks with metadata
 */
export async function generateMarkdownChunks(
  analysisData: PDFAnalysisData,
  reductionResult: ContentReductionResult,
  aiAgent: any
): Promise<ChunksResult> {
  const startTime = Date.now();
  const chunks: MarkdownChunk[] = [];
  
  // Group by language and page for chunk generation
  const languagePages = new Map<string, Set<number>>();
  
  for (const group of reductionResult.groups) {
    for (const text of group.originalTexts) {
      if (!languagePages.has(text.language)) {
        languagePages.set(text.language, new Set());
      }
      languagePages.get(text.language)!.add(group.pageNumber);
    }
  }

  // Generate chunks for each language-page combination
  for (const [language, pages] of languagePages) {
    for (const pageNum of pages) {
      const pageGroups = reductionResult.groups.filter((g) => 
        g.pageNumber === pageNum && 
        g.originalTexts.some((t) => t.language === language)
      );

      if (pageGroups.length > 0) {
        const markdownContent = await generatePageMarkdown(pageGroups, language, pageNum, aiAgent);
        
        chunks.push({
          id: uuidv4(),
          content: markdownContent,
          sourceGroups: pageGroups.map((g) => g.id),
          language,
          pageNumbers: [pageNum],
          metadata: {
            chunkType: 'page',
            layoutReference: language,
            mergedPages: undefined,
            childChunks: undefined
          }
        });
      }
    }
  }

  return {
    chunks,
    totalChunks: chunks.length,
    languages: Array.from(languagePages.keys()),
    processedAt: new Date(),
    metadata: {
      chunkingStrategy: 'page-based-with-language-separation',
      aiModel: AI_PROCESSING_SETTINGS.primaryModel,
      processingTime: Date.now() - startTime
    }
  };
}

/**
 * Generate markdown for a page with proper structure
 */
async function generatePageMarkdown(
  pageGroups: ContentReductionGroup[],
  language: string,
  pageNumber: number,
  aiAgent: any
): Promise<string> {
  // Sort groups by order and position
  const sortedGroups = pageGroups.sort((a, b) => a.order - b.order);
  
  let markdown = `# Page ${pageNumber} (${language.toUpperCase()})\n\n`;
  
  for (const group of sortedGroups) {
    const text = group.originalTexts.find((t) => t.language === language);
    if (text) {
      switch (group.type) {
        case 'title':
          markdown += `## ${text.text}\n\n`;
          break;
        case 'list':
          markdown += `- ${text.text}\n`;
          break;
        case 'paragraph':
        default:
          markdown += `${text.text}\n\n`;
          break;
      }
    }
  }
  
  return markdown;
}

// Helper functions

/**
 * Create grouping prompt with configurable template
 */
function createGroupingPrompt(textBlocks: ProcessedTextBlock[]): string {
  return `
You are analyzing text blocks extracted from a multilingual PDF document. Your task is to intelligently group text blocks that represent the same content across different languages or related content within the same language.

CRITICAL GROUPING RULES:
1. For TITLES/HEADERS: Group text blocks that appear to be the same title in different languages
2. For PARAGRAPHS: Group text blocks that contain the same paragraph content in different languages
3. For LISTS: Group list items that represent the same content across languages
4. Consider LAYOUT POSITION: Blocks in similar positions likely contain equivalent content
5. Consider TEXT LENGTH: Similar-length blocks in similar positions often represent the same content

Text blocks to analyze:
${textBlocks.map((block, idx) => 
  `Block ${idx}: Page ${block.pageNumber}, Position [${block.bbox?.join(',')}], Length: ${block.text.length}, Text: "${block.text.substring(0, AI_PROCESSING_SETTINGS.maxChunkSize)}..."`
).join('\n')}

Return a JSON array of groups where each group represents content that should be grouped together:
{
  "groups": [
    {
      "id": "uuid-string",
      "type": "title|paragraph|list|table|other",
      "blockIndices": [0, 5, 12],
      "confidence": 0.95,
      "reasoning": "Brief explanation of why these blocks are grouped"
    }
  ]
}

Focus on quality over quantity - only group blocks that clearly represent the same content.
`;
}

/**
 * Create language detection prompt
 */
function createLanguageDetectionPrompt(text: string): string {
  return `
Detect the language of this text and return only the ISO 639-1 language code (2 letters, lowercase):

Text: "${text.substring(0, 200)}"

Return only the language code (e.g., "en", "tr", "de", "fr", "es", etc.). If uncertain, return "unknown".
`;
}

/**
 * Calculate overall bounding box from multiple blocks
 */
function calculateOverallBbox(blocks: ProcessedTextBlock[]): [number, number, number, number] {
  if (blocks.length === 0) return [0, 0, 0, 0];
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const block of blocks) {
    if (block.bbox && Array.isArray(block.bbox) && block.bbox.length === 4) {
      minX = Math.min(minX, block.bbox[0]);
      minY = Math.min(minY, block.bbox[1]);
      maxX = Math.max(maxX, block.bbox[2]);
      maxY = Math.max(maxY, block.bbox[3]);
    }
  }
  
  return [minX, minY, maxX, maxY];
}

/**
 * Create fallback groups when AI processing fails
 */
function createFallbackGroups(textBlocks: ProcessedTextBlock[]): ContentReductionGroup[] {
  return textBlocks.map((block, idx) => ({
    id: uuidv4(),
    type: 'paragraph' as const,
    originalTexts: [],
    bbox: block.bbox,
    pageNumber: block.pageNumber,
    order: idx,
    _blockIndices: [idx],
    _confidence: 0.3
  }));
}
