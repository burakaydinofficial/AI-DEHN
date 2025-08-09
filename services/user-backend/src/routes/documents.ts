import { Router, Request, Response, NextFunction } from 'express';
import type { ApiResponse, Document, PaginatedResponse } from '@dehn/api-models';
import { db } from '../server';

export const documentsRouter = Router();

// Public: list published documents metadata
documentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '10')));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.collection('documents')
        .find({ published: { $exists: true, $ne: [] } }, { projection: { _id: 0, id: 1, originalName: 1, uploadedAt: 1, published: 1 } })
        .sort({ uploadedAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('documents').countDocuments({ published: { $exists: true, $ne: [] } })
    ]);

    res.json({
      success: true,
      data: items as unknown as Document[],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      timestamp: new Date()
    } as PaginatedResponse<Document>);
  } catch (error) { next(error); }
});

// Public: get a document with its published variants
documentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await db.collection('documents').findOne(
      { id: req.params.id },
      { projection: { _id: 0, id: 1, originalName: 1, uploadedAt: 1, published: 1 } }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date() } as ApiResponse);
    res.json({ success: true, data: doc as unknown as Document, timestamp: new Date() } as ApiResponse<Document>);
  } catch (error) { next(error); }
});
