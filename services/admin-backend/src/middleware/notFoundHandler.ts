import { Request, Response } from 'express';
import { ApiResponse } from '@dehn/api-models';

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date()
  };

  res.status(404).json(response);
};
