import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Settings, 
  Globe, 
  CheckCircle,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const IngestionPage: React.FC = () => {
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  const fetchRecentUploads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents`);
      setRecentUploads(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recent uploads:', error);
    }
  };

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
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type === 'application/pdf') {
        uploadFile(file);
      } else {
        // Show error for non-PDF files
        setUploading(prev => [...prev, {
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

    setUploading(prev => [...prev, uploadProgress]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API_BASE}/admin/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          
          setUploading(prev => prev.map(item => 
            item.filename === file.name 
              ? { ...item, progress }
              : item
          ));
        }
      });

      // Update status to success
      setUploading(prev => prev.map(item => 
        item.filename === file.name 
          ? { ...item, status: 'success', progress: 100 }
          : item
      ));

      // Refresh the recent uploads list
      setTimeout(() => {
        fetchRecentUploads();
        setUploading(prev => prev.filter(item => item.filename !== file.name));
      }, 2000);

    } catch (error: any) {
      setUploading(prev => prev.map(item => 
        item.filename === file.name 
          ? { 
              ...item, 
              status: 'error', 
              error: error.response?.data?.message || 'Upload failed' 
            }
          : item
      ));
    }
  };

  const removeUpload = (filename: string) => {
    setUploading(prev => prev.filter(item => item.filename !== filename));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Content Ingestion</h3>
        
        {/* Upload Areas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium">PDF Documents</p>
            <p className="text-sm text-gray-600">Drag & drop or browse</p>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer opacity-50">
            <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium">CAD Files</p>
            <p className="text-sm text-gray-600">Coming soon</p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer opacity-50">
            <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium">Translations</p>
            <p className="text-sm text-gray-600">Coming soon</p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">Upload Progress</h4>
            <div className="space-y-2">
              {uploading.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{upload.filename}</span>
                      <button 
                        onClick={() => removeUpload(upload.filename)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {upload.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{upload.error}</span>
                      </div>
                    )}
                  </div>
                  {upload.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'uploading' && (
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Uploads */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Recent Uploads</h4>
          <div className="space-y-2">
            {recentUploads.slice(0, 5).map((document) => (
              <div key={document.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">{document.filename}</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500">
                    {new Date(document.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {recentUploads.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No uploads yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Pipeline Info */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Supported File Types & Processing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Document Types</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">PDF Documents (.pdf)</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded opacity-50">
                <div className="w-4 h-4 bg-gray-300 rounded" />
                <span className="text-sm">Word Documents (.docx) - Coming Soon</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded opacity-50">
                <div className="w-4 h-4 bg-gray-300 rounded" />
                <span className="text-sm">CAD Files (.dwg, .dxf) - Coming Soon</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Processing Pipeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>1. Upload & Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>2. Content Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>3. Size Reduction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>4. Content Chunking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span>5. Translation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>6. Publishing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
