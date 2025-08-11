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
import { DOCUMENT_STATUS, UPLOAD_STATUS, DocumentStatus, UploadStatus } from '../../constants/enums';
import './AdminPages.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface UploadProgress {
  id: string;
  filename: string;
  size: number;
  status: UploadStatus;
  progress: number;
  error?: string;
  documentId?: string;
}

interface UploadedDocument {
  id: string;
  filename: string;
  originalName: string;
  status: DocumentStatus;
  uploadedAt: string;
  size: number;
  error?: string;
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
          id: Date.now().toString(),
          filename: file.name,
          size: file.size,
          progress: 0,
          status: UPLOAD_STATUS.ERROR,
          error: 'Only PDF files are supported'
        }]);
      }
    });
  };

  const uploadFile = async (file: File) => {
    const uploadProgress: UploadProgress = {
      id: Date.now().toString(),
      filename: file.name,
      size: file.size,
      progress: 0,
      status: UPLOAD_STATUS.UPLOADING
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
              upload.filename === file.name && upload.status === UPLOAD_STATUS.UPLOADING
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
                status: UPLOAD_STATUS.PROCESSING,
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
                status: doc.status === DOCUMENT_STATUS.PROCESSED ? UPLOAD_STATUS.SUCCESS : 
                       doc.status === DOCUMENT_STATUS.FAILED ? UPLOAD_STATUS.ERROR : UPLOAD_STATUS.PROCESSING,
                error: doc.error
              }
            : upload
        ));

        if (doc.status === DOCUMENT_STATUS.PROCESSED || doc.status === DOCUMENT_STATUS.FAILED) {
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

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case UPLOAD_STATUS.UPLOADING:
      case UPLOAD_STATUS.PROCESSING:
        return <RefreshCw className="admin-upload-status-icon admin-loading-spinner" />;
      case UPLOAD_STATUS.SUCCESS:
        return <CheckCircle className="admin-upload-status-icon success" />;
      case UPLOAD_STATUS.ERROR:
        return <AlertCircle className="admin-upload-status-icon error" />;
      default:
        return <FileText className="admin-upload-status-icon default" />;
    }
  };

  const getStatusMessage = (upload: UploadProgress) => {
    switch (upload.status) {
      case UPLOAD_STATUS.UPLOADING:
        return `Uploading... ${upload.progress}%`;
      case UPLOAD_STATUS.PROCESSING:
        return 'Processing PDF (extracting content and images)...';
      case UPLOAD_STATUS.SUCCESS:
        return 'PDF processed successfully - ready for content reduction';
      case UPLOAD_STATUS.ERROR:
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
                    {upload.status === UPLOAD_STATUS.UPLOADING && (
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
