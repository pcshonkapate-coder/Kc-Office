"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  Award, BookOpen, Code2, MessageSquare, CheckCircle2, Clock,
  Sparkles, Download, ExternalLink, ShieldCheck, Star, FileText, Send,
  ChevronRight, AlertCircle, Play
} from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  category: 'AI / ML' | 'Algorithms' | 'Deep Learning';
  difficulty: 'Intermediate' | 'Advanced' | 'Foundational';
  description: string;
  requirements: string[];
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED';
  submittedCode?: string;
  submissionNotes?: string;
  mentorFeedback?: {
    mentorName: string;
    date: string;
    comment: string;
    score: number;
  };
}

export const InternLearningHub: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const showToast = useDemoStore((state) => state.showToast);

  const [modules, setModules] = useState<LearningModule[]>([
    {
      id: 'MOD-AML-01',
      title: 'Anti-Money Laundering (AML) Anomaly Detection',
      category: 'AI / ML',
      difficulty: 'Advanced',
      description:
        'Engineer an unsupervised Isolation Forest and Autoencoder pipeline to detect financial transaction smurfing and anomalous routing across high-velocity synthetic banking ledgers.',
      requirements: [
        'Ingest transaction CSV stream and compute rolling velocity features',
        'Implement Isolation Forest with dynamic threshold calibration',
        'Output precision-recall curve and ROC-AUC benchmark report'
      ],
      status: 'APPROVED',
      submittedCode: `# AML Autoencoder Pipeline\nimport numpy as np\nfrom sklearn.ensemble import IsolationForest\n\ndef detect_smurfing(transactions):\n    model = IsolationForest(contamination=0.015, random_state=42)\n    preds = model.fit_predict(transactions)\n    return preds == -1`,
      mentorFeedback: {
        mentorName: 'Shon Kapate (Principal Consultant)',
        date: '2026-09-18',
        comment:
          'Excellent feature engineering on the rolling transaction windows. Model achieves 0.94 ROC-AUC. Approved for production synthesis.',
        score: 96
      }
    },
    {
      id: 'MOD-SORT-02',
      title: 'Array Sorting Optimization & Algorithmic Complexity',
      category: 'Algorithms',
      difficulty: 'Intermediate',
      description:
        'Benchmark hybrid 3-way QuickSort against Python TimSort on heavily skewed, nearly-sorted, and duplicate-heavy array datasets. Analyze cache locality and branch mispredictions.',
      requirements: [
        'Implement 3-way partitioning QuickSort (Dutch National Flag problem)',
        'Measure nanosecond CPU cycle execution on arrays up to 1,000,000 integers',
        'Document Big-O space complexity and worst-case recursion bounds'
      ],
      status: 'SUBMITTED',
      submittedCode: `# 3-Way QuickSort Benchmark\ndef partition3(arr, l, r):\n    pivot = arr[l]\n    lt = l\n    gt = r\n    i = l + 1\n    while i <= gt:\n        if arr[i] < pivot:\n            arr[lt], arr[i] = arr[i], arr[lt]\n            lt += 1; i += 1\n        elif arr[i] > pivot:\n            arr[gt], arr[i] = arr[i], arr[gt]\n            gt -= 1\n        else:\n            i += 1\n    return lt, gt`,
      mentorFeedback: {
        mentorName: 'Priya Sharma (Delivery Lead)',
        date: '2026-09-20',
        comment:
          'Implementation handles duplicate keys in linear O(N) time as required. Please add asymptotic memory profiling graph.',
        score: 91
      }
    },
    {
      id: 'MOD-PERC-03',
      title: 'Linear Perceptron Evaluation & Gradient Descent',
      category: 'Deep Learning',
      difficulty: 'Advanced',
      description:
        'Derive and construct a multi-layer perceptron with cross-entropy loss, backpropagation chain rule derivatives, and Adam optimization strictly from first principles using pure NumPy.',
      requirements: [
        'Implement forward and backward propagation passes with vectorization',
        'Verify gradient descent convergence on non-linear XOR boundary',
        'Include mathematical LaTeX derivation write-up of loss gradient'
      ],
      status: 'PENDING'
    }
  ]);

  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [submissionCode, setSubmissionCode] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Competency Vector Metrics
  const competencies = [
    { label: 'Python & Vectorization', score: 94, fullMark: 100 },
    { label: 'Data Pipelines & ETL', score: 88, fullMark: 100 },
    { label: 'Algorithmic Efficiency', score: 92, fullMark: 100 },
    { label: 'Delivery & Documentation', score: 90, fullMark: 100 },
  ];

  const approvedCount = modules.filter((m) => m.status === 'APPROVED').length;
  const isEligibleForCert = approvedCount >= 1; // Eligible when required assignments pass mentor audit

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    setModules((prev) =>
      prev.map((m) =>
        m.id === selectedModule.id
          ? {
              ...m,
              status: 'SUBMITTED',
              submittedCode: submissionCode,
              submissionNotes,
              mentorFeedback: {
                mentorName: 'Automated Test Harness',
                date: 'Just now',
                comment: 'Automated test suite passed. Queued for Senior Staff Engineer code review.',
                score: 85
              }
            }
          : m
      )
    );

    showToast(`Submitted "${selectedModule.title}" for mentor code review!`, 'success');
    setSelectedModule(null);
    setSubmissionCode('');
    setSubmissionNotes('');
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in font-sans">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[90px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" /> Intern Academy & Research Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Kapate OS Mentorship Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Isolated enterprise learning pipelines, mentor code reviews, competency metrics, and verified graduation certification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCertificateModal(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isEligibleForCert
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-900/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Download Official Certificate</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* 1. STRUCTURED LEARNING PIPELINES */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> Assigned Technical Curriculum
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Completed: <strong className="text-white">{approvedCount}</strong> / {modules.length} modules
            </span>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      {mod.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">[{mod.id}]</span>
                    <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      mod.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : mod.status === 'SUBMITTED'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {mod.description}
                </p>

                {/* Requirements */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Engineering Deliverables:
                  </span>
                  {mod.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>

                {/* Mentor Feedback Loop */}
                {mod.mentorFeedback && (
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Mentor Code Review — {mod.mentorFeedback.mentorName}
                      </span>
                      <span className="font-mono font-bold text-purple-200 bg-purple-900/50 px-2 py-0.5 rounded">
                        Score: {mod.mentorFeedback.score} / 100
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      &ldquo;{mod.mentorFeedback.comment}&rdquo;
                    </p>
                  </div>
                )}

                {/* Submission Action */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setSelectedModule(mod);
                      setSubmissionCode(mod.submittedCode || '');
                      setSubmissionNotes(mod.submissionNotes || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{mod.status === 'PENDING' ? 'Submit Assignment Code' : 'Update Submission'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. COMPETENCY TRACKING (SKILLS MASTERY) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Cohort Competency Mastery
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Evaluation index across core technical competency domains updated via mentor sign-offs.
              </p>
            </div>

            <div className="space-y-4">
              {competencies.map((comp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{comp.label}</span>
                    <span className="font-mono font-bold text-blue-400">{comp.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-700"
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Graduation Criteria:</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Interns must attain &gt;85% overall average score and complete all pipeline assignments to qualify for full-time junior consultant roles at Kapate Consultancy.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* CODE SUBMISSION MODAL */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Submit Deliverable: {selectedModule.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Module Code: {selectedModule.id}</p>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Source Code Implementation (Python / TypeScript / C++)
                </label>
                <textarea
                  rows={8}
                  required
                  value={submissionCode}
                  onChange={(e) => setSubmissionCode(e.target.value)}
                  placeholder="# Paste complete modular solution here..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Architectural Write-Up & Benchmark Results
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Explain runtime metrics, asymptotic complexity, or mathematical derivations..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Submit to Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-950 border-2 border-amber-600/60 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 blur-[120px] pointer-events-none" />

            <div className="text-center space-y-3 pb-6 border-b border-slate-800 relative z-10">
              <div className="flex items-center justify-center gap-3">
                <img src="/logo.png" alt="Kapate Consultancy" className="h-10 object-contain" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">
                Kapate Consultancy • Enterprise AI & Engineering Academy
              </h2>
              <h1 className="text-2xl lg:text-3xl font-serif font-black text-white">
                Certificate of Technical Mastery
              </h1>
              <p className="text-xs text-slate-400">
                This verified credential confirms that
              </p>
              <div className="text-xl font-bold text-white underline decoration-amber-500/60 underline-offset-8">
                {currentUser.name}
              </div>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed pt-2">
                has demonstrated exceptional competence in the rigorous engineering cohort, completing assigned pipelines across <strong>Anti-Money Laundering Detection</strong>, <strong>Algorithmic Complexity Optimization</strong>, and <strong>Multi-Layer Neural Architectures</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400 relative z-10">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Verification Hash</span>
                <span className="text-slate-300 text-[11px] truncate block">KC-CERT-2026-9F81E04B72</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Issue Date</span>
                <span className="text-slate-300 text-[11px] block">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 relative z-10">
              <div className="text-left">
                <div className="font-serif font-bold text-white text-sm">Shon Kapate</div>
                <div className="text-[10px] text-slate-400 font-mono">Founder & CEO, Kapate Consultancy</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    showToast('Certificate PDF ready for download!', 'success');
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
                >
                  <Download className="w-3.5 h-3.5" /> Download / Print PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
