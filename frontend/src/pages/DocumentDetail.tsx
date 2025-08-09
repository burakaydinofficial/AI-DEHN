import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import type { ApiResponse, Document } from '../types/api';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3091/api';

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => !!doc && (doc.storage?.analysisKey || doc.storage?.reducedKey || doc.storage?.chunksKey), [doc]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/documents/${id}`);
        const data = res.data as ApiResponse<Document>;
        if (!cancelled) setDoc(data.data || null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Failed to fetch document');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    const int = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(int); };
  }, [id]);

  async function triggerReduce() {
    await axios.post(`${API_BASE}/documents/${id}/reduce`);
    await refresh();
  }
  async function triggerChunks() {
    await axios.post(`${API_BASE}/documents/${id}/chunks`);
    await refresh();
  }
  async function triggerTranslate(language: string) {
    await axios.post(`${API_BASE}/documents/${id}/generate-translation`, { targetLanguage: language });
    await refresh();
  }
  async function publish(language: string, version: string) {
    await axios.post(`${API_BASE}/documents/${id}/publish`, { language, version });
    await refresh();
  }
  async function refresh() {
    const res = await axios.get(`${API_BASE}/documents/${id}`);
    const data = res.data as ApiResponse<Document>;
    setDoc(data.data || null);
  }

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>;
  if (!doc) return <div>Not found</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>{doc.originalName}</h2>
        <div style={{ color: '#6b7280' }}>Status: {doc.status} • Uploaded {new Date(doc.uploadedAt).toLocaleString()}</div>
      </div>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
        <h3>Processing</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={triggerReduce} disabled={!doc.storage?.analysisKey}>Create Reduced JSON</button>
          <button onClick={triggerChunks} disabled={!doc.storage?.reducedKey && !doc.storage?.analysisKey}>Generate Chunks</button>
          <button onClick={() => triggerTranslate('de')} disabled={!canGenerate}>Generate DE</button>
          <button onClick={() => triggerTranslate('fr')} disabled={!canGenerate}>Generate FR</button>
          <button onClick={() => triggerTranslate('es')} disabled={!canGenerate}>Generate ES</button>
        </div>
        <ul>
          <li>Analysis: {doc.storage?.analysisJson ? 'available' : '—'}</li>
          <li>Reduced: {doc.storage?.reducedJson ? 'available' : '—'}</li>
          <li>Chunks: {doc.storage?.chunksJson ? 'available' : '—'}</li>
          <li>Images: {doc.storage?.imagesPrefix ? 'uploaded' : '—'}</li>
        </ul>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
        <h3>Translations</h3>
        <div>
          {(doc.translations || []).length === 0 && <div style={{ color: '#6b7280' }}>No translations yet</div>}
          <ul>
            {(doc.translations || []).map((t, idx) => (
              <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{t.language || 'unknown'}</span>
                <button onClick={() => publish(t.language || 'unknown', 'generated')}>Publish</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
        <h3>Published</h3>
        <div>
          {(doc.published || []).length === 0 && <div style={{ color: '#6b7280' }}>Nothing published</div>}
          <ul>
            {(doc.published || []).map((p, idx) => (
              <li key={idx}>
                {p.language} / {p.version}: <a href={p.url} target="_blank" rel="noreferrer">{p.url}</a>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => publish('original', 'original')} disabled={!doc.storage?.analysisKey && !doc.storage?.chunksKey}>Publish Original JSON</button>
          </div>
        </div>
      </section>
    </div>
  );
}
