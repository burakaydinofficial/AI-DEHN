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
      console.log('Files selected:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
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
    console.log('Uploading file:', { name: file.name, size: file.size, type: file.type });
    
    const uploadProgress: UploadProgress = {
      filename: file.name,
      progress: 0,
      status: 'uploading'
    };

    setUploads(prev => [...prev, uploadProgress]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('FormData created, file appended:', file.name);

      const response = await axios.post(`${API_BASE}/admin/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress for ${file.name}: ${progress}%`);
            setUploads(prev => prev.map(upload => 
              upload.filename === file.name && upload.status === 'uploading'
                ? { ...upload, progress }
                : upload
            ));
          }
        }
      });

      console.log('Upload response:', response.data);

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
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
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
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          PDF Document Upload
        </h2>
        <p className="text-gray-600 mb-6">
          Upload PDF documents to extract content, images, and layout information. 
          The system will convert PDFs to structured data for multilingual processing.
        </p>

        {/* Upload Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : isProcessingClick
              ? 'border-gray-400 bg-gray-50 opacity-75'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } ${isProcessingClick ? 'pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop PDF files here or click to browse
          </h3>
          <p className="text-gray-600">
            Only PDF files are supported. Maximum file size: 100MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFileSelect}
            onClick={(e) => e.stopPropagation()}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Progress
          </h3>
          <div className="space-y-3">
            {uploads.map((upload, index) => (
              <div key={`${upload.filename}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(upload.status)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {upload.filename}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {getStatusMessage(upload)}
                  </p>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeUpload(upload.filename)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Processing Pipeline
        </h3>
        <div className="text-blue-800 space-y-2">
          <p>1. <strong>PDF Upload:</strong> Original PDF is stored and queued for processing</p>
          <p>2. <strong>Content Extraction:</strong> PDF is converted to ZIP with extracted text, images, and layout data</p>
          <p>3. <strong>Structure Analysis:</strong> Content is analyzed for layout, fonts, and positioning</p>
          <p>4. <strong>Ready for Reduction:</strong> Once processed, document is ready for content grouping and language detection</p>
        </div>
      </div>
    </div>
  );
};
