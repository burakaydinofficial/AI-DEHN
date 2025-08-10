import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  RefreshCw, 
  Plus,
  Link2,
  Eye,
  CheckCircle,
  Clock,
  Package,
  FileText,
  Languages,
  ExternalLink,
  Search,
  Filter,
  X,
  Save
} from 'lucide-react';
import axios from 'axios';
import './AdminPages.css';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: string;
  availableLanguages: string[];
  translations?: Array<{
    language: string;
    chunksGenerated: boolean;
  }>;
  storage?: {
    chunksJson?: boolean;
    analysisJson?: boolean;
  };
}

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
}

interface PublishReadyDocument {
  id: string;
  documentId: string;
  documentName: string;
  language: string;
  contentType: 'original' | 'translation';
  chunksCount: number;
  imagesCount: number;
  status: 'ready' | 'preparing' | 'failed';
  generatedAt: string;
  chunks: Array<{
    id: string;
    content: string;
    pageNumbers: number[];
    images?: string[];
  }>;
}

interface PublishedDocument {
  id: string;
  publishReadyDocumentId: string;
  productId: string;
  documentName: string;
  productName: string;
  productCode: string;
  language: string;
  version: string;
  url: string;
  publishedAt: string;
  status: 'published' | 'unpublished';
}

interface LinkFormData {
  documentId: string;
  productId: string;
  language: string;
  version: string;
}

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001/api';

export const PublishingPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [publishReadyDocs, setPublishReadyDocs] = useState<PublishReadyDocument[]>([]);
  const [publishedDocs, setPublishedDocs] = useState<PublishedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ready' | 'published'>('ready');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkFormData, setLinkFormData] = useState<LinkFormData>({
    documentId: '',
    productId: '',
    language: '',
    version: 'v1.0'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [preparingDocument, setPreparingDocument] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDocuments(),
        fetchProducts(),
        fetchPublishReadyDocuments(),
        fetchPublishedDocuments()
      ]);
    } catch (error) {
      console.error('Failed to fetch publishing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents`);
      if (response.data.success) {
        // Only get documents that have chunks or translations ready
        const readyDocs = (response.data.data || []).filter((doc: Document) => 
          doc.storage?.chunksJson || (doc.translations && doc.translations.length > 0)
        );
        setDocuments(readyDocs);
      } else {
        // Mock data for development
        setDocuments([
          {
            id: '1',
            filename: 'lightning-rod-manual.pdf',
            originalName: 'Lightning Rod Installation Manual',
            status: 'chunked',
            availableLanguages: ['en', 'de', 'fr'],
            translations: [
              { language: 'de', chunksGenerated: true },
              { language: 'fr', chunksGenerated: true }
            ],
            storage: { chunksJson: true, analysisJson: true }
          },
          {
            id: '2',
            filename: 'grounding-system-guide.pdf',
            originalName: 'Grounding System Installation Guide',
            status: 'translated',
            availableLanguages: ['en', 'es'],
            translations: [
              { language: 'es', chunksGenerated: true }
            ],
            storage: { chunksJson: true, analysisJson: true }
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/products`);
      if (response.data.success) {
        setProducts(response.data.data || []);
      } else {
        // Mock data for development
        setProducts([
          {
            id: '1',
            name: 'Lightning Rod System A',
            code: 'LRS-A-001',
            category: 'Lightning Protection',
            status: 'active'
          },
          {
            id: '2',
            name: 'Grounding Conductor Type B',
            code: 'GC-B-002',
            category: 'Grounding Systems',
            status: 'active'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const fetchPublishReadyDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/publish-ready-documents`);
      if (response.data.success) {
        setPublishReadyDocs(response.data.data || []);
      } else {
        // Mock data for development
        setPublishReadyDocs([
          {
            id: '1',
            documentId: '1',
            documentName: 'Lightning Rod Installation Manual',
            language: 'en',
            contentType: 'original',
            chunksCount: 15,
            imagesCount: 8,
            status: 'ready',
            generatedAt: '2025-01-10T10:00:00Z',
            chunks: []
          },
          {
            id: '2',
            documentId: '1',
            documentName: 'Lightning Rod Installation Manual',
            language: 'de',
            contentType: 'translation',
            chunksCount: 15,
            imagesCount: 8,
            status: 'ready',
            generatedAt: '2025-01-10T11:00:00Z',
            chunks: []
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch publish-ready documents:', error);
      setPublishReadyDocs([]);
    }
  };

  const fetchPublishedDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/published-documents`);
      if (response.data.success) {
        setPublishedDocs(response.data.data || []);
      } else {
        // Mock data for development
        setPublishedDocs([
          {
            id: '1',
            publishReadyDocumentId: '1',
            productId: '1',
            documentName: 'Lightning Rod Installation Manual',
            productName: 'Lightning Rod System A',
            productCode: 'LRS-A-001',
            language: 'en',
            version: 'v1.0',
            url: 'https://docs.dehn.com/products/lrs-a-001/en/v1.0',
            publishedAt: '2025-01-10T12:00:00Z',
            status: 'published'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch published documents:', error);
      setPublishedDocs([]);
    }
  };

  const prepareDocumentForPublishing = async (documentId: string, language: string) => {
    try {
      setPreparingDocument(`${documentId}-${language}`);
      
      const response = await axios.post(`${API_BASE}/admin/documents/${documentId}/prepare-for-publishing`, {
        language
      });
      
      if (response.data.success) {
        await fetchPublishReadyDocuments();
      } else {
        // Mock successful preparation
        const document = documents.find(d => d.id === documentId);
        if (document) {
          const newReadyDoc: PublishReadyDocument = {
            id: Date.now().toString(),
            documentId,
            documentName: document.originalName,
            language,
            contentType: language === 'en' ? 'original' : 'translation',
            chunksCount: Math.floor(Math.random() * 20) + 5,
            imagesCount: Math.floor(Math.random() * 10) + 1,
            status: 'ready',
            generatedAt: new Date().toISOString(),
            chunks: []
          };
          setPublishReadyDocs([...publishReadyDocs, newReadyDoc]);
        }
      }
    } catch (error) {
      console.error('Failed to prepare document for publishing:', error);
      alert('Failed to prepare document for publishing. Please try again.');
    } finally {
      setPreparingDocument(null);
    }
  };

  const openLinkModal = (publishReadyDocId?: string) => {
    const publishReadyDoc = publishReadyDocs.find(d => d.id === publishReadyDocId);
    setLinkFormData({
      documentId: publishReadyDoc?.documentId || '',
      productId: '',
      language: publishReadyDoc?.language || '',
      version: 'v1.0'
    });
    setShowLinkModal(true);
  };

  const handleLinkAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing('linking');

    try {
      const publishReadyDoc = publishReadyDocs.find(d => 
        d.documentId === linkFormData.documentId && d.language === linkFormData.language
      );
      
      if (!publishReadyDoc) {
        alert('Please prepare the document for publishing first.');
        return;
      }

      const response = await axios.post(`${API_BASE}/admin/publish-document`, {
        publishReadyDocumentId: publishReadyDoc.id,
        productId: linkFormData.productId,
        version: linkFormData.version
      });

      if (response.data.success) {
        await fetchPublishedDocuments();
        setShowLinkModal(false);
      } else {
        // Mock successful publishing
        const product = products.find(p => p.id === linkFormData.productId);
        if (product && publishReadyDoc) {
          const newPublishedDoc: PublishedDocument = {
            id: Date.now().toString(),
            publishReadyDocumentId: publishReadyDoc.id,
            productId: linkFormData.productId,
            documentName: publishReadyDoc.documentName,
            productName: product.name,
            productCode: product.code,
            language: linkFormData.language,
            version: linkFormData.version,
            url: `https://docs.dehn.com/products/${product.code.toLowerCase()}/language=${linkFormData.language}/version=${linkFormData.version}`,
            publishedAt: new Date().toISOString(),
            status: 'published'
          };
          setPublishedDocs([...publishedDocs, newPublishedDoc]);
          setShowLinkModal(false);
        }
      }
    } catch (error) {
      console.error('Failed to publish document:', error);
      alert('Failed to publish document. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const unpublishDocument = async (publishedDocId: string) => {
    if (!confirm('Are you sure you want to unpublish this document?')) {
      return;
    }

    try {
      setProcessing(`unpublish-${publishedDocId}`);
      
      const response = await axios.post(`${API_BASE}/admin/unpublish-document/${publishedDocId}`);
      
      if (response.data.success) {
        setPublishedDocs(publishedDocs.map(doc => 
          doc.id === publishedDocId 
            ? { ...doc, status: 'unpublished' as const }
            : doc
        ));
      } else {
        setPublishedDocs(publishedDocs.filter(doc => doc.id !== publishedDocId));
      }
    } catch (error) {
      console.error('Failed to unpublish document:', error);
      alert('Failed to unpublish document. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  // Filter functions
  const filteredPublishReadyDocs = publishReadyDocs.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.documentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === '' || doc.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  const filteredPublishedDocs = publishedDocs.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === '' || doc.language === languageFilter;
    const matchesProduct = productFilter === '' || doc.productId === productFilter;
    return matchesSearch && matchesLanguage && matchesProduct;
  });

  // Get unique languages for filter
  const allLanguages = [
    ...new Set([
      ...publishReadyDocs.map(d => d.language),
      ...publishedDocs.map(d => d.language)
    ])
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-content">
          <RefreshCw className="admin-loading-spinner" />
          <span>Loading publishing data...</span>
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
            <Globe2 className="admin-page-icon" />
            <h1>Document Publishing</h1>
          </div>
          <button
            onClick={() => openLinkModal()}
            className="admin-btn primary"
            disabled={publishReadyDocs.length === 0}
          >
            <Plus className="admin-btn-icon" />
            Publish Document
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('ready')}
            className={`admin-tab ${activeTab === 'ready' ? 'active' : ''}`}
          >
            <FileText className="admin-tab-icon" />
            Publish Ready ({publishReadyDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`admin-tab ${activeTab === 'published' ? 'active' : ''}`}
          >
            <Globe2 className="admin-tab-icon" />
            Published ({publishedDocs.length})
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Languages</option>
              {allLanguages.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {activeTab === 'published' && (
            <div className="filter-group">
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Documents awaiting preparation */}
        {documents.length > 0 && publishReadyDocs.length === 0 && (
          <div className="admin-info-section">
            <h3>Documents Ready for Preparation</h3>
            <p className="info-text">
              These documents have been processed and are ready to be prepared for publishing.
            </p>
            <div className="preparation-list">
              {documents.map(doc => (
                <div key={doc.id} className="preparation-item">
                  <div className="preparation-info">
                    <h4>{doc.originalName}</h4>
                    <div className="language-list">
                      <span>Available languages: </span>
                      {doc.availableLanguages.map(lang => (
                        <span key={lang} className="language-tag">{lang.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                  <div className="preparation-actions">
                    {doc.availableLanguages.map(lang => (
                      <button
                        key={lang}
                        onClick={() => prepareDocumentForPublishing(doc.id, lang)}
                        disabled={preparingDocument === `${doc.id}-${lang}`}
                        className="admin-btn secondary"
                      >
                        {preparingDocument === `${doc.id}-${lang}` ? (
                          <>
                            <RefreshCw className="admin-btn-icon animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <Plus className="admin-btn-icon" />
                            Prepare {lang.toUpperCase()}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'ready' ? (
          // Publish Ready Documents
          filteredPublishReadyDocs.length === 0 ? (
            <div className="admin-empty-state">
              <FileText className="admin-empty-icon" />
              <h3>No documents ready for publishing</h3>
              <p>Prepare processed documents above to make them available for publishing.</p>
            </div>
          ) : (
            <div className="admin-document-list">
              {filteredPublishReadyDocs.map(doc => (
                <div key={doc.id} className="admin-document-item">
                  <div className="admin-document-header">
                    <div className="admin-document-info">
                      <div className="admin-document-title-row">
                        <h3 className="admin-document-name">
                          {doc.documentName}
                        </h3>
                        <div className="admin-status-badge status-ready">
                          <CheckCircle className="admin-status-icon" />
                          <span>Ready to Publish</span>
                        </div>
                      </div>

                      <div className="document-meta">
                        <div className="meta-item">
                          <Languages className="meta-icon" />
                          <span>{doc.language.toUpperCase()}</span>
                        </div>
                        <div className="meta-item">
                          <FileText className="meta-icon" />
                          <span>{doc.contentType}</span>
                        </div>
                        <div className="meta-item">
                          <Clock className="meta-icon" />
                          <span>Prepared {new Date(doc.generatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="admin-stats-grid">
                        <div className="admin-stat info">
                          <div className="stat-value">{doc.chunksCount}</div>
                          <div className="stat-label">Content Chunks</div>
                        </div>
                        <div className="admin-stat success">
                          <div className="stat-value">{doc.imagesCount}</div>
                          <div className="stat-label">Images</div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-document-actions">
                      <button
                        onClick={() => openLinkModal(doc.id)}
                        className="admin-btn primary"
                      >
                        <Link2 className="admin-btn-icon" />
                        Link & Publish
                      </button>
                      
                      <button className="admin-btn secondary">
                        <Eye className="admin-btn-icon" />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Published Documents
          filteredPublishedDocs.length === 0 ? (
            <div className="admin-empty-state">
              <Globe2 className="admin-empty-icon" />
              <h3>No published documents</h3>
              <p>Link documents with products and publish them to make them available.</p>
            </div>
          ) : (
            <div className="admin-document-list">
              {filteredPublishedDocs.map(doc => (
                <div key={doc.id} className="admin-document-item">
                  <div className="admin-document-header">
                    <div className="admin-document-info">
                      <div className="admin-document-title-row">
                        <h3 className="admin-document-name">
                          {doc.documentName}
                        </h3>
                        <div className={`admin-status-badge ${doc.status === 'published' ? 'status-success' : 'status-warning'}`}>
                          {doc.status === 'published' ? (
                            <CheckCircle className="admin-status-icon" />
                          ) : (
                            <Clock className="admin-status-icon" />
                          )}
                          <span>{doc.status}</span>
                        </div>
                      </div>

                      <div className="document-meta">
                        <div className="meta-item">
                          <Package className="meta-icon" />
                          <span>{doc.productName} ({doc.productCode})</span>
                        </div>
                        <div className="meta-item">
                          <Languages className="meta-icon" />
                          <span>{doc.language.toUpperCase()}</span>
                        </div>
                        <div className="meta-item">
                          <span className="version-badge">{doc.version}</span>
                        </div>
                      </div>

                      <div className="published-info">
                        <div className="published-date">
                          Published {new Date(doc.publishedAt).toLocaleDateString()}
                        </div>
                        <div className="published-url">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="url-link">
                            {doc.url}
                            <ExternalLink className="url-icon" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="admin-document-actions">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn secondary"
                      >
                        <Eye className="admin-btn-icon" />
                        View Live
                      </a>
                      
                      {doc.status === 'published' && (
                        <button
                          onClick={() => unpublishDocument(doc.id)}
                          disabled={processing === `unpublish-${doc.id}`}
                          className="admin-btn danger"
                        >
                          {processing === `unpublish-${doc.id}` ? (
                            <RefreshCw className="admin-btn-icon animate-spin" />
                          ) : (
                            <X className="admin-btn-icon" />
                          )}
                          Unpublish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Statistics */}
      <div className="admin-stats-section">
        <h3>Publishing Overview</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card info">
            <div className="stat-value">{publishReadyDocs.length}</div>
            <div className="stat-label">Ready to Publish</div>
          </div>
          <div className="admin-stat-card success">
            <div className="stat-value">{publishedDocs.filter(d => d.status === 'published').length}</div>
            <div className="stat-label">Currently Published</div>
          </div>
          <div className="admin-stat-card warning">
            <div className="stat-value">{allLanguages.length}</div>
            <div className="stat-label">Languages Available</div>
          </div>
          <div className="admin-stat-card purple">
            <div className="stat-value">{products.filter(p => p.status === 'active').length}</div>
            <div className="stat-label">Active Products</div>
          </div>
        </div>
      </div>

      {/* Link & Publish Modal */}
      {showLinkModal && (
        <div className="admin-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowLinkModal(false);
        }}>
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Link Document with Product & Publish</h2>
              <button onClick={() => setShowLinkModal(false)} className="admin-modal-close">
                <X />
              </button>
            </div>
            
            <form onSubmit={handleLinkAndPublish} className="admin-modal-content">
              <div className="form-group">
                <label htmlFor="document">Document</label>
                <select
                  id="document"
                  value={`${linkFormData.documentId}-${linkFormData.language}`}
                  onChange={(e) => {
                    const [docId, lang] = e.target.value.split('-');
                    setLinkFormData({...linkFormData, documentId: docId || '', language: lang || ''});
                  }}
                  required
                  className="form-select"
                >
                  <option value="">Select a document</option>
                  {publishReadyDocs.map(doc => (
                    <option key={`${doc.documentId}-${doc.language}`} value={`${doc.documentId}-${doc.language}`}>
                      {doc.documentName} ({doc.language.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="product">Product *</label>
                <select
                  id="product"
                  value={linkFormData.productId}
                  onChange={(e) => setLinkFormData({...linkFormData, productId: e.target.value})}
                  required
                  className="form-select"
                >
                  <option value="">Select a product</option>
                  {products.filter(p => p.status === 'active').map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="version">Version</label>
                <input
                  type="text"
                  id="version"
                  value={linkFormData.version}
                  onChange={(e) => setLinkFormData({...linkFormData, version: e.target.value})}
                  className="form-input"
                  placeholder="e.g., v1.0, v2.1"
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="admin-btn secondary"
                  disabled={processing === 'linking'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn primary"
                  disabled={processing === 'linking'}
                >
                  {processing === 'linking' ? (
                    <>
                      <RefreshCw className="admin-btn-icon animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Save className="admin-btn-icon" />
                      Link & Publish
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
