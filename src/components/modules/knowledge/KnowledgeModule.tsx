"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  BookOpen, Search, Plus, ShieldCheck,
  Eye, ChevronRight, X
} from 'lucide-react';
import { KnowledgeArticle } from '../../../types';

export const KnowledgeModule: React.FC = () => {
  const knowledgeArticles = useDemoStore((state) => state.knowledgeArticles);
  const addKnowledgeArticle = useDemoStore((state) => state.addKnowledgeArticle);
  const currentUser = useDemoStore((state) => state.currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New article form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeArticle['category']>('SOP');
  const [newTags, setNewTags] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');

  const filteredArticles = knowledgeArticles.filter(art => {
    const matchesCategory = selectedCategory === 'ALL' || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    addKnowledgeArticle({
      title: newTitle.trim(),
      category: newCategory,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      summary: newSummary.trim() || newContent.slice(0, 100) + '...',
      content: newContent.trim(),
      author: currentUser.name,
      verified: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN'
    });

    setNewTitle('');
    setNewTags('');
    setNewSummary('');
    setNewContent('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> Corporate Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Knowledge Base & SOPs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard operating procedures, security protocols, technical guidelines, and onboarding wiki.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Publish Article
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search wiki by keyword, SOP, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
          {['ALL', 'SOP', 'SECURITY', 'DEVELOPMENT', 'INVOICING', 'POLICY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Articles Grid or Detail View */}
      {selectedArticle ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <button
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-4 font-semibold cursor-pointer"
          >
            &larr; Back to all articles
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {selectedArticle.category}
            </span>
            {selectedArticle.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Authoritative Verified
              </span>
            )}
            <span className="text-xs text-slate-500">
              Updated: {selectedArticle.updatedAt} by {selectedArticle.author}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">{selectedArticle.title}</h2>
          <p className="text-sm text-slate-600 mb-6 italic border-l-2 border-blue-600 pl-3">
            {selectedArticle.summary}
          </p>

          <div className="max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap">
            {selectedArticle.content}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {selectedArticle.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-xl bg-slate-100 text-[11px] text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {art.category}
                  </span>
                  {art.verified && (
                    <span className="text-emerald-600" title="Verified Article">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                  {art.summary}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {art.viewsCount} reads
                </span>
                <span className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                  Read Article <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Article Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Publish SOP or Wiki Article</h2>
                <p className="text-xs text-slate-500">Add documentation to the company operating knowledge base.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Deployment Standard"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="SOP">SOP</option>
                    <option value="SECURITY">Security</option>
                    <option value="DEVELOPMENT">Development</option>
                    <option value="INVOICING">Invoicing</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="POLICY">Policy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard, DevOps"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Executive Summary</label>
                <input
                  type="text"
                  placeholder="Short 1-sentence abstract"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Full Content / Body</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Document step-by-step instructions, standard rules, and guidelines..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KnowledgeModule;
