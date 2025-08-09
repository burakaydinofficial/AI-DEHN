import { Router, Request, Response, NextFunction } from 'express';
import { User, ApiResponse, PaginatedResponse, UpdateUserRequest } from '../../types';

export const usersRouter = Router();

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@dehn.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true
  },
  {
    id: '2',
    email: 'user@dehn.com',
    name: 'Regular User',
    role: 'user',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    isActive: true
  }
];

// Get all users
usersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    let filteredUsers = mockUsers;
    
    if (search) {
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const response: PaginatedResponse<User> = {
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// Get user by ID
usersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = mockUsers.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date()
    } as ApiResponse<User>);
  } catch (error) {
    return next(error);
  }
});

// Update user
usersRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIndex = mockUsers.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    const updateData: UpdateUserRequest = req.body;
    const user = mockUsers[userIndex];

    // Update user fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.isActive !== undefined) user.isActive = updateData.isActive;
    user.updatedAt = new Date();

    mockUsers[userIndex] = user;

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
      timestamp: new Date()
    } as ApiResponse<User>);
  } catch (error) {
    return next(error);
  }
});

// Delete user
usersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIndex = mockUsers.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    mockUsers.splice(userIndex, 1);

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date()
    } as ApiResponse);
  } catch (error) {
    return next(error);
  }
});
