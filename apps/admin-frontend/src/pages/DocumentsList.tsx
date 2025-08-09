import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import type { ApiResponse, Document } from '@dehn/api-models';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3091/api';

type ListResponse = ApiResponse<Document[]> & { pagination?: { page: number; limit: number; total: number; pages: number } };

export function DocumentsList() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/documents`);
        const data = res.data as ListResponse;
        if (!cancelled) setDocs(data.data || []);
      } catch (e) {
        const err = e as AxiosError<{ message?: string }>;
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load documents');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        <UploadWidget onUploaded={() => window.location.reload()} />
      </div>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Filename</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Size</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Uploaded</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{d.originalName}</td>
                  <td style={{ padding: 8 }}>{(d.size / 1024 / 1024).toFixed(2)} MB</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ fontSize: 12, background: '#eef2ff', color: '#4338ca', padding: '2px 6px', borderRadius: 999 }}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{new Date(d.uploadedAt).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>
                    <Link to={`/documents/${d.id}`}>View</Link>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No documents yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type UploadWidgetProps = { onUploaded: () => void };

function UploadWidget({ onUploaded }: UploadWidgetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await axios.post(`${API_BASE}/documents/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploaded();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      setErr(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button disabled={!file || busy} onClick={handleUpload}>{busy ? 'Uploading…' : 'Upload PDF'}</button>
      {err && <span style={{ color: 'crimson', fontSize: 12 }}>{err}</span>}
    </div>
  );
}
