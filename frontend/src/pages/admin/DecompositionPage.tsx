import React, { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Link,
  FileText,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001/api';

interface DocumentSection {
  id: string;
  title: string;
  level: number;
  type: 'section' | 'subsection';
  safety_level?: 'critical' | 'warning' | 'info';
  linked_components?: string[];
  page_range?: string;
}

interface Document {
  id: string;
  filename: string;
  status: string;
  sections?: DocumentSection[];
}

interface LinkedComponent {
  id: string;
  name: string;
  type: string;
  used_in: number;
  status: 'shared' | 'updated' | 'template';
}

export const DecompositionPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mockSections: DocumentSection[] = [
    { id: '1', title: '1. Safety Overview', level: 1, type: 'section', safety_level: 'critical' },
    { id: '1.1', title: '1.1 Personal Protective Equipment', level: 2, type: 'subsection', page_range: '2-3' },
    { id: '1.2', title: '1.2 Electrical Hazards', level: 2, type: 'subsection', safety_level: 'critical', page_range: '4-5' },
    { id: '2', title: '2. Installation Steps', level: 1, type: 'section' },
    { id: '2.1', title: '2.1 Site Preparation', level: 2, type: 'subsection', linked_components: ['site-prep'], page_range: '6-8' },
    { id: '2.2', title: '2.2 Foundation Setup', level: 2, type: 'subsection', page_range: '9-11' },
    { id: '3', title: '3. Testing and Validation', level: 1, type: 'section' },
    { id: '3.1', title: '3.1 Electrical Testing', level: 2, type: 'subsection', safety_level: 'warning', page_range: '12-14' }
  ];

  const mockComponents: LinkedComponent[] = [
    { id: '1', name: 'Ground Rod Assembly', type: 'Hardware', used_in: 3, status: 'shared' },
    { id: '2', name: 'Torque Specifications', type: 'Procedure', used_in: 5, status: 'updated' },
    { id: '3', name: 'Safety Checklist', type: 'Template', used_in: 8, status: 'template' },
    { id: '4', name: 'Cable Routing Guide', type: 'Procedure', used_in: 2, status: 'shared' }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/admin/documents`);
      const docs = response.data.data || [];
      setDocuments(docs.filter((d: Document) => d.status !== 'uploaded'));
      
      if (docs.length > 0) {
        setSelectedDocument({ ...docs[0], sections: mockSections });
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyBadge = (level?: string) => {
    switch (level) {
      case 'critical':
        return <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Critical</span>;
      case 'warning':
        return <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Warning</span>;
      case 'info':
        return <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Info</span>;
      default:
        return null;
    }
  };

  const getComponentStatusColor = (status: string) => {
    switch (status) {
      case 'shared': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'template': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument({ ...doc, sections: mockSections });
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading decomposition data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Selection */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Document Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => handleDocumentSelect(doc)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedDocument?.id === doc.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{doc.filename}</h4>
                  <p className="text-xs text-gray-600 capitalize">{doc.status} document</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDocument ? (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Semantic Decomposition</h3>
            <button 
              onClick={() => handleViewDocument(selectedDocument.id)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              View Full Document
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Structure */}
            <div>
              <h4 className="font-medium mb-3">Document Structure</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedDocument.sections?.map((section) => (
                  <div 
                    key={section.id} 
                    className={`flex items-center gap-2 p-2 rounded ${
                      section.safety_level === 'critical' 
                        ? 'bg-red-50' 
                        : section.safety_level === 'warning'
                        ? 'bg-orange-50'
                        : 'bg-gray-50'
                    }`}
                    style={{ marginLeft: `${section.level * 16}px` }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-sm flex-1">{section.title}</span>
                    {section.linked_components && (
                      <Link className="w-3 h-3 text-blue-500" />
                    )}
                    {section.page_range && (
                      <span className="text-xs text-gray-500">p.{section.page_range}</span>
                    )}
                    {getSafetyBadge(section.safety_level)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Linked Components */}
            <div>
              <h4 className="font-medium mb-3">Linked Components</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mockComponents.map((component) => (
                  <div key={component.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-medium text-sm">{component.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${getComponentStatusColor(component.status)}`}>
                        {component.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {component.type} • Used in {component.used_in} documents
                    </p>
                    <div className="flex gap-2">
                      <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                        View Details
                      </button>
                      <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                        Related Docs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Analysis Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-lg font-bold text-gray-800">{selectedDocument.sections?.length || 0}</p>
                <p className="text-xs text-gray-600">Total Sections</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-800">
                  {selectedDocument.sections?.filter(s => s.safety_level === 'critical').length || 0}
                </p>
                <p className="text-xs text-red-600">Critical Safety</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-lg font-bold text-blue-800">{mockComponents.length}</p>
                <p className="text-xs text-blue-600">Linked Components</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-800">
                  {mockComponents.filter(c => c.status === 'shared').length}
                </p>
                <p className="text-xs text-green-600">Reusable Parts</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
          <p className="text-gray-600">Select a document above to view its semantic decomposition</p>
        </div>
      )}
    </div>
  );
};
