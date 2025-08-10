import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getAppContext } from '../../utils/context';
import { 
  Product, 
  ProductCreateRequest, 
  ProductUpdateRequest,
  ApiResponse, 
  PaginatedResponse,
  ApiError
} from '../../types/api';

export const productsRouter = Router();

// Get all products with optional filtering
productsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      status = '' 
    } = req.query;

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }

    // Get total count
    const totalCount = await db.collection('products').countDocuments(filter);
    
    // Get paginated products
    const products = await db.collection('products')
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .toArray();

    // Add document count for each product
    const productsWithDocCount = await Promise.all(
      products.map(async (product) => {
        const docCount = await db.collection('publishedDocuments')
          .countDocuments({ productId: product.id });
        
        // Remove MongoDB's _id field and add documentCount
        const { _id, ...productData } = product;
        return {
          ...productData,
          documentCount: docCount
        };
      })
    );

    const response: PaginatedResponse<Product> = {
      success: true,
      data: productsWithDocCount as Product[],
      timestamp: new Date(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get product by ID
productsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const product = await db.collection('products').findOne({ id });
    
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    // Add document count
    const documentCount = await db.collection('publishedDocuments')
      .countDocuments({ productId: id });

    // Remove MongoDB's _id field
    const { _id, ...productData } = product;

    const response: ApiResponse<Product> = {
      success: true,
      data: {
        ...productData,
        documentCount
      } as Product,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create new product
productsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const productData: ProductCreateRequest = req.body;

    // Validate required fields
    if (!productData.name || !productData.code || !productData.category) {
      throw new ApiError('Name, code, and category are required', 400);
    }

    // Check if product code already exists
    const existingProduct = await db.collection('products').findOne({ 
      code: productData.code 
    });
    
    if (existingProduct) {
      throw new ApiError('Product code already exists', 409);
    }

    const newProduct: Product = {
      id: uuidv4(),
      name: productData.name,
      code: productData.code,
      description: productData.description || '',
      category: productData.category,
      status: productData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      documentCount: 0
    };

    await db.collection('products').insertOne(newProduct);

    const response: ApiResponse<Product> = {
      success: true,
      data: newProduct,
      message: 'Product created successfully',
      timestamp: new Date()
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Update product
productsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updateData: ProductUpdateRequest = req.body;

    // Check if product exists
    const existingProduct = await db.collection('products').findOne({ id });
    if (!existingProduct) {
      throw new ApiError('Product not found', 404);
    }

    // If updating code, check if new code already exists
    if (updateData.code && updateData.code !== existingProduct.code) {
      const codeExists = await db.collection('products').findOne({ 
        code: updateData.code,
        id: { $ne: id }
      });
      
      if (codeExists) {
        throw new ApiError('Product code already exists', 409);
      }
    }

    const updatedFields = {
      ...updateData,
      updatedAt: new Date()
    };

    await db.collection('products').updateOne(
      { id },
      { $set: updatedFields }
    );

    const updatedProduct = await db.collection('products').findOne({ id });

    // Add document count
    const documentCount = await db.collection('publishedDocuments')
      .countDocuments({ productId: id });

    // Remove MongoDB's _id field if present
    const { _id, ...productData } = updatedProduct as any;

    const response: ApiResponse<Product> = {
      success: true,
      data: {
        ...productData,
        documentCount
      } as Product,
      message: 'Product updated successfully',
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Delete product (only if no documents are linked)
productsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Check if product exists
    const product = await db.collection('products').findOne({ id });
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    // Check if any documents are linked to this product
    const linkedDocuments = await db.collection('publishedDocuments')
      .countDocuments({ productId: id });

    if (linkedDocuments > 0) {
      throw new ApiError('Cannot delete product with linked documents. Unpublish all documents first.', 409);
    }

    await db.collection('products').deleteOne({ id });

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully',
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get product categories
productsRouter.get('/categories/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    
    const categories = await db.collection('products')
      .distinct('category');

    const response: ApiResponse<string[]> = {
      success: true,
      data: categories,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get product statistics
productsRouter.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    
    const [totalProducts, activeProducts, categories, totalPublications] = await Promise.all([
      db.collection('products').countDocuments(),
      db.collection('products').countDocuments({ status: 'active' }),
      db.collection('products').distinct('category'),
      db.collection('publishedDocuments').countDocuments()
    ]);

    const stats = {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      categoriesCount: categories.length,
      totalPublications,
      categories: categories
    };

    const response: ApiResponse = {
      success: true,
      data: stats,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});
