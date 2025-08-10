import React, { useState, useEffect } from 'react';
import { 
  Package, 
  RefreshCw, 
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  Filter
} from 'lucide-react';
import axios from 'axios';
import './AdminPages.css';

interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
}

interface ProductFormData {
  name: string;
  code: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'discontinued';
}

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001/api';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    code: '',
    description: '',
    category: '',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Add escape key listener for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal || editingProduct) {
          closeModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddModal, editingProduct]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/admin/products`);
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Mock data for development
      setProducts([
        {
          id: '1',
          name: 'Lightning Rod System A',
          code: 'LRS-A-001',
          description: 'Standard lightning rod system for residential buildings',
          category: 'Lightning Protection',
          status: 'active',
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
          documentCount: 3
        },
        {
          id: '2',
          name: 'Grounding Conductor Type B',
          code: 'GC-B-002',
          description: 'Heavy-duty grounding conductor for industrial applications',
          category: 'Grounding Systems',
          status: 'active',
          createdAt: '2025-01-02T10:00:00Z',
          updatedAt: '2025-01-02T10:00:00Z',
          documentCount: 1
        },
        {
          id: '3',
          name: 'Surge Protector SP-300',
          code: 'SP-300',
          description: 'Advanced surge protection device for commercial use',
          category: 'Surge Protection',
          status: 'discontinued',
          createdAt: '2024-12-01T10:00:00Z',
          updatedAt: '2024-12-01T10:00:00Z',
          documentCount: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: '',
      status: 'active'
    });
    setShowAddModal(true);
    setEditingProduct(null);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description,
      category: product.category,
      status: product.status
    });
    setEditingProduct(product);
    setShowAddModal(false);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      category: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingProduct) {
        // Update existing product
        const response = await axios.put(`${API_BASE}/admin/products/${editingProduct.id}`, formData);
        if (response.data.success) {
          setProducts(products.map(p => 
            p.id === editingProduct.id 
              ? { ...p, ...formData, updatedAt: new Date().toISOString() }
              : p
          ));
        }
      } else {
        // Create new product
        const response = await axios.post(`${API_BASE}/admin/products`, formData);
        if (response.data.success) {
          const newProduct: Product = {
            id: Date.now().toString(),
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            documentCount: 0
          };
          setProducts([...products, newProduct]);
        }
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/admin/products/${productId}`);
      if (response.data.success) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-success';
      case 'inactive':
        return 'status-warning';
      case 'discontinued':
        return 'status-error';
      default:
        return 'status-default';
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
    const matchesStatus = statusFilter === '' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-content">
          <RefreshCw className="admin-loading-spinner" />
          <span>Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-section">
        <div className="admin-page-header">
          <div className="admin-page-title">
            <Package className="admin-page-icon" />
            <h1>Product Management</h1>
          </div>
          <button
            onClick={openAddModal}
            className="admin-btn primary"
          >
            <Plus className="admin-btn-icon" />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="admin-empty-state">
            <Package className="admin-empty-icon" />
            <h3>No products found</h3>
            <p>
              {products.length === 0 
                ? "Start by adding your first product to enable document publishing." 
                : "No products match your current filters."}
            </p>
          </div>
        ) : (
          <div className="admin-document-list">
            {filteredProducts.map((product) => (
              <div key={product.id} className="admin-document-item">
                <div className="admin-document-header">
                  <div className="admin-document-info">
                    <div className="admin-document-title-row">
                      <h3 className="admin-document-name">
                        {product.name}
                      </h3>
                      <div className={`admin-status-badge ${getStatusBadgeClass(product.status)}`}>
                        <Package className="admin-status-icon" />
                        <span>{product.status}</span>
                      </div>
                    </div>

                    <div className="product-details">
                      <div className="product-code">
                        <strong>Code:</strong> {product.code}
                      </div>
                      <div className="product-category">
                        <strong>Category:</strong> {product.category}
                      </div>
                      <div className="product-description">
                        {product.description}
                      </div>
                    </div>

                    <div className="admin-stats-grid">
                      <div className="admin-stat info">
                        <div className="stat-value">{product.documentCount || 0}</div>
                        <div className="stat-label">Linked Documents</div>
                      </div>
                      <div className="admin-stat default">
                        <div className="stat-value">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="stat-label">Last Updated</div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-document-actions">
                    <button
                      onClick={() => openEditModal(product)}
                      className="admin-btn secondary"
                    >
                      <Edit3 className="admin-btn-icon" />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="admin-btn danger"
                      disabled={(product.documentCount || 0) > 0}
                      title={(product.documentCount || 0) > 0 ? "Cannot delete product with linked documents" : "Delete product"}
                    >
                      <Trash2 className="admin-btn-icon" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="admin-stats-section">
        <h3>Product Overview</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card success">
            <div className="stat-value">{products.filter(p => p.status === 'active').length}</div>
            <div className="stat-label">Active Products</div>
          </div>
          <div className="admin-stat-card warning">
            <div className="stat-value">{products.filter(p => p.status === 'inactive').length}</div>
            <div className="stat-label">Inactive Products</div>
          </div>
          <div className="admin-stat-card error">
            <div className="stat-value">{products.filter(p => p.status === 'discontinued').length}</div>
            <div className="stat-label">Discontinued</div>
          </div>
          <div className="admin-stat-card info">
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <div className="admin-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}>
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="admin-modal-close">
                <X />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-modal-content">
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="form-input"
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="code">Product Code *</label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                  className="form-input"
                  placeholder="Enter product code (e.g., LRS-A-001)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  className="form-input"
                  placeholder="Enter product category"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(category => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-textarea"
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="admin-btn secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="admin-btn-icon animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="admin-btn-icon" />
                      {editingProduct ? 'Update' : 'Create'} Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
