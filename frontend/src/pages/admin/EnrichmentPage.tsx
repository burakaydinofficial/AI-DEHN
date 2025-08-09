import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Link, 
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001/api';

interface SafetyFlag {
  id: string;
  type: 'electrical' | 'mechanical' | 'chemical' | 'equipment';
  level: 'critical' | 'warning' | 'info';
  section: string;
  description: string;
  step?: string;
}

interface LinkedPart {
  id: string;
  part_number: string;
  name: string;
  type: string;
  specifications: string[];
  related_manuals: number;
}

export const EnrichmentPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock safety flags
  const mockSafetyFlags: SafetyFlag[] = [
    {
      id: '1',
      type: 'electrical',
      level: 'critical',
      section: 'Step 3.2',
      description: 'High voltage present during testing',
      step: 'Electrical Testing Phase'
    },
    {
      id: '2',
      type: 'equipment',
      level: 'warning',
      section: 'Step 2.1',
      description: 'Insulated tools mandatory',
      step: 'Site Preparation'
    },
    {
      id: '3',
      type: 'mechanical',
      level: 'info',
      section: 'Step 4.5',
      description: 'Proper lifting technique required',
      step: 'Component Installation'
    }
  ];

  // Mock linked parts
  const mockLinkedParts: LinkedPart[] = [
    {
      id: '1',
      part_number: 'LR-2024-A',
      name: 'Lightning Rod Assembly',
      type: 'Primary Component',
      specifications: ['Copper construction', 'Height: 2.5m', 'Thread: M16'],
      related_manuals: 5
    },
    {
      id: '2',
      part_number: 'GR-508-B',
      name: 'Grounding Clamp',
      type: 'Connection Hardware',
      specifications: ['Stainless steel', 'Cable: 6-25mm²', 'IP67 rated'],
      related_manuals: 3
    },
    {
      id: '3',
      part_number: 'SP-301-C',
      name: 'Surge Protector Module',
      type: 'Protection Device',
      specifications: ['Max current: 40kA', 'Response: <25ns', 'DIN rail mount'],
      related_manuals: 8
    }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/admin/documents`);
      const docs = response.data.data || [];
      setDocuments(docs.filter((d: any) => d.status === 'analyzed' || d.status === 'reduced' || d.status === 'chunked'));
      
      if (docs.length > 0) {
        setSelectedDocument(docs[0]);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (level: string, type: 'bg' | 'text' | 'border') => {
    const colors = {
      critical: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-500' },
      warning: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-500' },
      info: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500' }
    };
    return colors[level as keyof typeof colors]?.[type] || colors.info[type];
  };

  const getSafetyIcon = (type: string) => {
    switch (type) {
      case 'electrical':
        return '⚡';
      case 'mechanical':
        return '⚙️';
      case 'chemical':
        return '☢️';
      case 'equipment':
        return '🛠️';
      default:
        return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading enrichment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Selection */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Content Enrichment</h3>
        
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {documents.slice(0, 3).map((doc) => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDocument(doc)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedDocument?.id === doc.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-sm mb-1">{doc.filename}</h4>
                <p className="text-xs text-gray-600 capitalize">{doc.status}</p>
                <div className="mt-2 flex gap-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Ready for enrichment
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No documents ready for enrichment</p>
            <p className="text-sm text-gray-400">Documents need to be analyzed first</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Safety Flagging */}
          <div>
            <h4 className="font-medium mb-3">Safety Flagging</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {mockSafetyFlags.map((flag) => (
                <div 
                  key={flag.id} 
                  className={`p-3 border-l-4 rounded ${getSafetyColor(flag.level, 'bg')} ${getSafetyColor(flag.level, 'border')}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getSafetyIcon(flag.type)}</span>
                    <AlertTriangle className={`w-4 h-4 ${getSafetyColor(flag.level, 'text').replace('text-', 'text-').replace('-800', '-600')}`} />
                    <span className={`font-medium ${getSafetyColor(flag.level, 'text')}`}>
                      {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)} Hazard
                    </span>
                    <span className={`ml-auto text-xs px-2 py-1 rounded ${
                      flag.level === 'critical' ? 'bg-red-100 text-red-800' :
                      flag.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {flag.level}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${getSafetyColor(flag.level, 'text').replace('-800', '-700')}`}>
                    {flag.section}: {flag.description}
                  </p>
                  {flag.step && (
                    <p className="text-xs text-gray-600 mt-1">
                      Context: {flag.step}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Component Linking */}
          <div>
            <h4 className="font-medium mb-3">Component Linking</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {mockLinkedParts.map((part) => (
                <div key={part.id} className="p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium">Part #{part.part_number}</h5>
                      <p className="text-sm text-gray-600">{part.name}</p>
                      <p className="text-xs text-gray-500">{part.type}</p>
                    </div>
                    <Link className="w-4 h-4 text-blue-600 mt-1" />
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Specifications:</p>
                    <div className="flex flex-wrap gap-1">
                      {part.specifications.map((spec, index) => (
                        <span key={index} className="text-xs bg-white text-gray-700 px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                      View Specs
                    </button>
                    <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                      Related Manuals ({part.related_manuals})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrichment Actions */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Enrichment Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <p className="font-medium text-sm">Auto-Flag Safety Issues</p>
                <p className="text-xs text-gray-600">AI-powered safety detection</p>
              </div>
            </button>
            
            <button className="flex items-center gap-2 p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
              <Link className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-sm">Link Components</p>
                <p className="text-xs text-gray-600">Connect parts and procedures</p>
              </div>
            </button>
            
            <button className="flex items-center gap-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-sm">Validate Enrichment</p>
                <p className="text-xs text-gray-600">Review and approve changes</p>
              </div>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Enrichment Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded">
              <p className="text-lg font-bold text-red-800">
                {mockSafetyFlags.filter(f => f.level === 'critical').length}
              </p>
              <p className="text-xs text-red-600">Critical Safety Flags</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <p className="text-lg font-bold text-yellow-800">
                {mockSafetyFlags.filter(f => f.level === 'warning').length}
              </p>
              <p className="text-xs text-yellow-600">Warning Flags</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-lg font-bold text-blue-800">{mockLinkedParts.length}</p>
              <p className="text-xs text-blue-600">Linked Components</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-lg font-bold text-green-800">
                {mockLinkedParts.reduce((sum, part) => sum + part.related_manuals, 0)}
              </p>
              <p className="text-xs text-green-600">Cross-References</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
