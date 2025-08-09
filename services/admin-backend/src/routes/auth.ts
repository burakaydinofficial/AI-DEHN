import { Router, Request, Response, NextFunction } from 'express';
import { AuthRequest, AuthResponse, ApiResponse } from '@dehn/api-models';

export const authRouter = Router();

// Mock user data for demonstration
const mockUsers = [
  {
    id: '1',
    email: 'admin@dehn.com',
    name: 'Admin User',
    role: 'admin' as const,
    password: 'admin123', // In real app, this would be hashed
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

// Login endpoint
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: AuthRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date()
      } as ApiResponse);
    }

    // Find user (in real app, this would query the database)
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        timestamp: new Date()
      } as ApiResponse);
    }

    // Generate JWT token (simplified for demo)
    const token = `mock-jwt-token-${user.id}`;

    const response: AuthResponse = {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Logout endpoint
authRouter.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date()
  } as ApiResponse);
});

// Get current user
authRouter.get('/me', (req: Request, res: Response) => {
  // Mock authentication check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date()
    } as ApiResponse);
  }

  // Mock user data
  res.json({
    success: true,
    data: {
      id: '1',
      email: 'admin@dehn.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    timestamp: new Date()
  } as ApiResponse);
});
