<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# DEHN Hackathon Project - Copilot Instructions

## Project Overview
This is a multi-service document processing application built for a hackathon. The project consists of:

### Services
- **PDF Processor** (`services/pdf-processor/`) - Python service using Bottle and PyMuPDF
- **Admin Backend** (`services/admin-backend/`) - Express TypeScript service for admin operations
- **User Backend** (`services/user-backend/`) - Express TypeScript service for user operations

### Frontend Applications
- **Admin Frontend** (`apps/admin-frontend/`) - React TypeScript app (desktop-first design)
- **Mobile Frontend** (`apps/mobile-frontend/`) - React TypeScript app (mobile-first design)

### Shared Libraries
- **API Models** (`packages/api-models/`) - Shared TypeScript types and interfaces
- **AI Agent** (`packages/ai-agent/`) - Common library for LLM integration using Google Gemini

### Infrastructure
- **Terraform** (`infrastructure/terraform/`) - Google Cloud Platform deployment configuration

## Development Guidelines

### Code Style
- Use TypeScript for all Node.js services and React applications
- Follow functional programming patterns where possible
- Use async/await instead of Promise chains
- Use proper error handling with try/catch blocks
- Include comprehensive TypeScript types

### API Design
- All APIs should follow RESTful conventions
- Use the shared API models from `@dehn/api-models`
- Return consistent response structures using `ApiResponse` type
- Include proper HTTP status codes
- Use pagination for list endpoints

### Frontend Development
- Use React functional components with hooks
- Implement responsive design (desktop-first for admin, mobile-first for mobile app)
- Use proper TypeScript typing for all props and state
- Handle loading and error states consistently
- Use axios for API calls with proper error handling

### Python Service
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Include comprehensive error handling
- Use structured logging
- Keep dependencies minimal and focused

### AI Integration
- Use the shared `@dehn/ai-agent` library for all LLM interactions
- Handle AI API errors gracefully with fallbacks
- Implement proper token counting and rate limiting
- Cache AI responses where appropriate

### Database & Storage
- Use Firestore for document metadata and user data
- Store actual PDF files in Google Cloud Storage
- Implement proper data validation and sanitization
- Use transactions for multi-document operations

### Security
- Validate all inputs
- Use JWT tokens for authentication
- Implement proper CORS configuration
- Store secrets in Google Secret Manager
- Use HTTPS for all external communications

### Testing
- Write unit tests for utility functions
- Include integration tests for API endpoints
- Test error scenarios and edge cases
- Use mock data for development and testing

### Deployment
- Use the provided Terraform configuration for infrastructure
- Build Docker containers for each service
- Use Google Cloud Run for serverless deployment
- Implement proper environment-based configuration

### Workspace Structure
- This is a monorepo using npm workspaces
- Run `npm install` from the root to install all dependencies
- Use workspace references (`workspace:*`) for internal packages
- Each service/app has its own package.json and scripts

## Common Patterns

### API Error Handling
```typescript
try {
  const result = await someApiCall();
  return res.json({ success: true, data: result, timestamp: new Date() });
} catch (error) {
  next(error);
}
```

### React Component Structure
```typescript
interface Props {
  // Define all props with types
}

export const ComponentName: React.FC<Props> = ({ ...props }) => {
  // Use hooks
  // Handle state and effects
  // Return JSX
};
```

### AI Integration
```typescript
import { AIAgent } from '@dehn/ai-agent';

const aiAgent = new AIAgent({ apiKey: process.env.AI_API_KEY });
const response = await aiAgent.analyzeDocument(content, prompt);
```

When working on this project, prioritize:
1. Type safety with comprehensive TypeScript usage
2. Consistent error handling across all services
3. Responsive and accessible UI design
4. Efficient AI token usage and caching
5. Proper security practices and input validation
