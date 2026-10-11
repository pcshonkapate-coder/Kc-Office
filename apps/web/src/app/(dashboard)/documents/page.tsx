'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ColumnDef, DataTable } from '../../../components/ui/DataTable';
import {
  BookOpen,
  CheckCircle,
  Download,
  FileCode,
  FileSignature,
  FileText,
  FolderArchive,
  History,
  Lock,
  Plus,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';

export default function DocumentsWorkspacePage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [activeTab, setActiveTab] = useState<'vault' | 'knowledge'>('vault');
  const [selectedCategory, setSelectedCategory] = useState<string>('SOP');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Version History Modal state
  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionChangelog, setNewVersionChangelog] = useState('');

  // 1. Fetch Documents
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await apiClient.get('/documents');
      return data;
    },
    enabled: can('document.read'),
  });

  // 2. Fetch Version History for selected document
  const { data: versionHistory = [] } = useQuery({
    queryKey: ['documents', historyDocId, 'versions'],
    queryFn: async () => {
      if (!historyDocId) return [];
      const { data } = await apiClient.get(`/documents/${historyDocId}/versions`);
      return data;
    },
    enabled: !!historyDocId,
  });

  // 3. Fetch Knowledge Base Articles
  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['documents', 'knowledge', selectedCategory],
    queryFn: async () => {
      const { data } = await apiClient.get(`/documents/knowledge?category=${selectedCategory}`);
      return data;
    },
    enabled: can('document.read'),
  });

  // Document Upload Mutation
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('tags', uploadTags);
      formData.append('file', uploadFile);

      await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadFile(null);
      setUploadTitle('');
      setUploadTags('');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      alert('File upload failed. Ensure safe file format.');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload New Version Mutation (Never silently overwriting)
  const handleNewVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyDocId || !newVersionFile) return;

    try {
      const formData = new FormData();
      formData.append('changelog', newVersionChangelog);
      formData.append('file', newVersionFile);

      await apiClient.post(`/documents/${historyDocId}/new-version`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNewVersionFile(null);
      setNewVersionChangelog('');
      queryClient.invalidateQueries({ queryKey: ['documents', historyDocId, 'versions'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      alert('Failed to upload new version.');
    }
  };

  // Download Trigger
  const handleDownload = (docId: string, filename: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/documents/${docId}/download`);
  };

  // Table Columns
  const documentColumns: ColumnDef<any>[] = [
    { key: 'title', header: 'Document Title', sortable: true },
    { key: 'latest_file_name', header: 'File Name' },
    {
      key: 'latest_file_size',
      header: 'Size',
      render: (row) =>
        row.latest_file_size ? `${(row.latest_file_size / 1024).toFixed(1)} KB` : '—',
    },
    {
      key: 'current_version_number',
      header: 'Version',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
          v{row.current_version_number}
        </span>
      ),
    },
    { key: 'owner_name', header: 'Owner' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownload(row.id, row.latest_file_name)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            title="Download Document"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setHistoryDocId(row.id)}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <History className="w-3 h-3" />
            <span>Versions</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            Knowledge & Document Management
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Cryptographic document vault, strict version control, and company SOP repository
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'vault'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Document Vault ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'knowledge'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Internal Knowledge Base & SOPs</span>
        </button>
      </div>

      {/* TAB 1: DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          {can('document.upload') && (
            <form onSubmit={handleUploadSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Secure Document Ingestion
              </span>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    setUploadFile(e.dataTransfer.files[0]);
                    if (!uploadTitle) setUploadTitle(e.dataTransfer.files[0].name);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-700 font-medium">
                  {uploadFile ? uploadFile.name : 'Drag & drop files here, or browse from computer'}
                </p>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadFile(e.target.files[0]);
                      if (!uploadTitle) setUploadTitle(e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                  id="doc-file-input"
                />
                <label
                  htmlFor="doc-file-input"
                  className="mt-2.5 inline-block px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Choose File
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  type="text"
                  placeholder="Document Title (e.g. Master Services Agreement 2026)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <input
                  type="text"
                  placeholder="Tags (e.g. legal, client, contract)"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {isUploading ? 'Securing & Storing...' : 'Ingest Document to Vault'}
                </button>
              </div>
            </form>
          )}

          {/* Documents Table */}
          <DataTable
            data={documents}
            columns={documentColumns}
            keyExtractor={(item) => item.id}
            searchPlaceholder="Search document vault..."
            searchableKeys={['title', 'latest_file_name', 'owner_name']}
            isLoading={loadingDocs}
          />
        </div>
      )}

      {/* TAB 2: INTERNAL KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Article Category & List Sidebar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {['SOP', 'POLICY', 'GUIDE', 'ARCHITECTURE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedArticle(null);
                  }}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {articles.map((article: any) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedArticle?.id === article.id
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate font-medium">{article.title}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Author: {article.author_name}</div>
                </div>
              ))}

              {articles.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No published {selectedCategory} documents found.
                </div>
              )}
            </div>
          </div>

          {/* Markdown Content Viewer */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs min-h-[400px]">
            {selectedArticle ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-blue-600 font-semibold tracking-wider">
                      {selectedArticle.category} • v{selectedArticle.version}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedArticle.title}</h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    By <strong className="text-slate-800">{selectedArticle.author_name}</strong>
                  </span>
                </div>
                <div className="prose max-w-none text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-5 rounded-xl border border-slate-200">
                  {selectedArticle.content_markdown}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
                <BookOpen className="w-8 h-8 text-slate-400 mb-2" />
                Select an article or SOP from the directory to review its documentation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERSION HISTORY & UPDATE MODAL */}
      {historyDocId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Immutable Version History</h3>
                <p className="text-xs text-slate-500">Strict document revision tracking & SHA-256 validation</p>
              </div>
              <button onClick={() => setHistoryDocId(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload New Version Section (Strict Never-Overwrite Policy) */}
            <form onSubmit={handleNewVersionSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-slate-800 block">Upload New Version</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="text"
                  placeholder="Changelog notes (e.g. Added clause 4.2)"
                  value={newVersionChangelog}
                  onChange={(e) => setNewVersionChangelog(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  required
                  type="file"
                  onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-slate-200 file:bg-white file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newVersionFile}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Commit New Version
                </button>
              </div>
            </form>

            {/* Versions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versionHistory.map((ver: any) => (
                <div key={ver.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 font-mono">v{ver.version_number}</span>
                      <span className="text-slate-900 font-semibold">{ver.file_name}</span>
                      <span className="text-slate-500">({(ver.file_size_bytes / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {ver.changelog} • Uploaded by {ver.uploader_name}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 mt-0.5 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>SHA-256: {ver.sha256_hash.slice(0, 24)}...</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(ver.document_id, ver.file_name)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-xs transition-colors"
                    title="Download this exact version"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
