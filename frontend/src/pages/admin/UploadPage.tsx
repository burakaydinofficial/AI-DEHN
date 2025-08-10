import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  X
} from 'lucide-react';
import axios from 'axios';
import './AdminPages.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

interface UploadedDocument {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  status: 'processing' | 'processed' | 'failed';
  uploadedAt: string;
  processedAt?: string;
  error?: string;
  stats?: {
    pageCount?: number;
    totalChars?: number;
    imagesCount?: number;
  };
}

export const UploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset processing state when files are actually selected
    setIsProcessingClick(false);
    
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDropZoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent rapid multiple clicks
    if (isProcessingClick) return;
    
    setIsProcessingClick(true);
    fileInputRef.current?.click();
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type === 'application/pdf') {
        uploadFile(file);
      } else {
        // Show error for non-PDF files
        setUploads(prev => [...prev, {
          filename: file.name,
          progress: 0,
          status: 'error',
          error: 'Only PDF files are supported'
        }]);
      }
    });
  };

  const uploadFile = async (file: File) => {
    const uploadProgress: UploadProgress = {
      filename: file.name,
      progress: 0,
      status: 'uploading'
    };

    setUploads(prev => [...prev, uploadProgress]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/admin/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploads(prev => prev.map(upload => 
              upload.filename === file.name && upload.status === 'uploading'
                ? { ...upload, progress }
                : upload
            ));
          }
        }
      });

      if (response.data.success) {
        setUploads(prev => prev.map(upload => 
          upload.filename === file.name
            ? { 
                ...upload, 
                progress: 100, 
                status: 'processing',
                documentId: response.data.document.id 
              }
            : upload
        ));

        // Start polling for processing status
        pollProcessingStatus(response.data.document.id, file.name);
      }

    } catch (error: any) {
      setUploads(prev => prev.map(upload => 
        upload.filename === file.name
          ? { 
              ...upload, 
              status: 'error', 
              error: error.response?.data?.message || error.message || 'Upload failed' 
            }
          : upload
      ));
    }
  };

  const pollProcessingStatus = async (documentId: string, filename: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/status`);
        const doc: UploadedDocument = response.data.data;

        setUploads(prev => prev.map(upload => 
          upload.filename === filename && upload.documentId === documentId
            ? { 
                ...upload, 
                status: doc.status === 'processed' ? 'success' : 
                       doc.status === 'failed' ? 'error' : 'processing',
                error: doc.error
              }
            : upload
        ));

        if (doc.status === 'processed' || doc.status === 'failed') {
          return; // Stop polling
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setUploads(prev => prev.map(upload => 
            upload.filename === filename && upload.documentId === documentId
              ? { ...upload, status: 'error', error: 'Processing timeout' }
              : upload
          ));
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    poll();
  };

  const removeUpload = (filename: string) => {
    setUploads(prev => prev.filter(upload => upload.filename !== filename));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw className="admin-upload-status-icon admin-loading-spinner" />;
      case 'success':
        return <CheckCircle className="admin-upload-status-icon success" />;
      case 'error':
        return <AlertCircle className="admin-upload-status-icon error" />;
      default:
        return <FileText className="admin-upload-status-icon default" />;
    }
  };

  const getStatusMessage = (upload: UploadProgress) => {
    switch (upload.status) {
      case 'uploading':
        return `Uploading... ${upload.progress}%`;
      case 'processing':
        return 'Processing PDF (extracting content and images)...';
      case 'success':
        return 'PDF processed successfully - ready for content reduction';
      case 'error':
        return upload.error || 'Unknown error';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Upload className="admin-page-icon" />
          <h1>PDF Document Upload</h1>
        </div>
      </div>

      {/* Upload Section */}
      <div className="admin-upload-section">
        <p className="admin-upload-description">
          Upload PDF documents to extract content, images, and layout information. 
          The system will convert PDFs to structured data for multilingual processing.
        </p>

        {/* Upload Drop Zone */}
        <div
          className={`admin-upload-dropzone ${
            dragActive ? 'active' : ''
          } ${isProcessingClick ? 'processing' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
        >
          <Upload className={`admin-upload-icon ${dragActive ? 'active' : ''}`} />
          <h3 className="admin-upload-title">
            Drop PDF files here or click to browse
          </h3>
          <p className="admin-upload-subtitle">
            Only PDF files are supported. Maximum file size: 100MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFileSelect}
            onClick={(e) => e.stopPropagation()}
            className="admin-upload-input"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="admin-upload-progress-section">
          <div className="admin-section-header">
            <h3>Upload Progress</h3>
          </div>
          <div className="admin-upload-progress-content">
            <div className="admin-upload-items">
              {uploads.map((upload, index) => (
                <div key={`${upload.filename}-${index}`} className="admin-upload-item">
                  {getStatusIcon(upload.status)}
                  <div className="admin-upload-item-details">
                    <h4 className="admin-upload-item-name">
                      {upload.filename}
                    </h4>
                    <p className="admin-upload-item-status">
                      {getStatusMessage(upload)}
                    </p>
                    {upload.status === 'uploading' && (
                      <div className="admin-upload-progress-bar">
                        <div 
                          className="admin-upload-progress-fill"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeUpload(upload.filename)}
                    className="admin-upload-remove-btn"
                  >
                    <X className="admin-upload-remove-icon" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Instructions */}
      <div className="admin-info-section">
        <h3 className="admin-info-title">
          Processing Pipeline
        </h3>
        <div className="admin-info-content">
          <div className="admin-info-step">
            <span className="admin-info-step-number">1.</span>
            <div>
              <strong>PDF Upload:</strong> Original PDF is stored and queued for processing
            </div>
          </div>
          <div className="admin-info-step">
            <span className="admin-info-step-number">2.</span>
            <div>
              <strong>Content Extraction:</strong> PDF is converted to ZIP with extracted text, images, and layout data
            </div>
          </div>
          <div className="admin-info-step">
            <span className="admin-info-step-number">3.</span>
            <div>
              <strong>Structure Analysis:</strong> Content is analyzed for layout, fonts, and positioning
            </div>
          </div>
          <div className="admin-info-step">
            <span className="admin-info-step-number">4.</span>
            <div>
              <strong>Ready for Reduction:</strong> Once processed, document is ready for content grouping and language detection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
