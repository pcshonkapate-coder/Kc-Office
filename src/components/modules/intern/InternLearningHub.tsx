"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  Award, BookOpen, Code2, MessageSquare, Download, Sparkles, Send, X
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
        'Benchmark hybrid sorting strategies (Timsort vs QuickSort with dual-pivot partition) on real-world skewed enterprise datasets to minimize branch prediction misses.',
      requirements: [
        'Benchmarked in Python / C extension against random, sorted, and reversed input arrays',
        'Memory allocation profile across N = 10,000 to 1,000,000 integers',
        'Detailed Big-O worst-case cache locality comparative memo'
      ],
      status: 'SUBMITTED',
      submittedCode: `# Dual-Pivot QuickSort Benchmark Module\nimport time\n\ndef dual_pivot_quicksort(arr, low, high):\n    # Optimized dual pivot implementation\n    pass`,
      submissionNotes:
        'Timsort performs up to 3.2x faster on arrays with pre-existing ordered runs due to galloping mode heuristics.',
      mentorFeedback: {
        mentorName: 'Shon Kapate (Principal Consultant)',
        date: '2026-09-22',
        comment:
          'Good benchmark harness. Add cachegrind instructions profiling to verify L1 miss reductions before final sign-off.',
        score: 88
      }
    },
    {
      id: 'MOD-DL-03',
      title: 'Multi-Layer Neural Network Forward & Backprop from Scratch',
      category: 'Deep Learning',
      difficulty: 'Advanced',
      description:
        'Build a multi-layer perceptron (MLP) purely with NumPy: implement forward pass matrix ops, cross-entropy loss, and vectorized analytical backpropagation gradients without PyTorch/TF.',
      requirements: [
        'Vectorized forward propagation with ReLU and Softmax activation activations',
        'Full analytical gradient computation (dW, db) across all hidden layers',
        'Mini-batch gradient descent with Adam optimizer verification on MNIST'
      ],
      status: 'PENDING'
    }
  ]);

  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [submissionCode, setSubmissionCode] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Competency mastery scores
  const competencies = [
    { label: 'Python 3.11 & Vectorized NumPy', score: 94 },
    { label: 'Isolation Forests & Anomaly Modeling', score: 91 },
    { label: 'Algorithmic Complexity & Big-O', score: 86 },
    { label: 'Analytical Neural Backpropagation', score: 78 },
    { label: 'Clean Code, Linting & Type Safety', score: 92 },
  ];

  const approvedCount = modules.filter((m) => m.status === 'APPROVED').length;
  const isEligibleForCert = approvedCount >= 1;

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
              submissionNotes: submissionNotes,
              mentorFeedback: {
                mentorName: 'Shon Kapate (Principal Consultant)',
                date: new Date().toISOString().split('T')[0],
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
    <div className="space-y-6 text-slate-900 animate-fade-in font-sans">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Intern Academy & Research Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Kapate OS Mentorship Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Isolated enterprise learning pipelines, mentor code reviews, competency metrics, and verified graduation certification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCertificateModal(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                isEligibleForCert
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Assigned Technical Curriculum
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Completed: <strong className="text-slate-900">{approvedCount}</strong> / {modules.length} modules
            </span>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {mod.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">[{mod.id}]</span>
                    <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      mod.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : mod.status === 'SUBMITTED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {mod.description}
                </p>

                {/* Requirements */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Engineering Deliverables:
                  </span>
                  {mod.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>

                {/* Mentor Feedback Loop */}
                {mod.mentorFeedback && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Mentor Code Review — {mod.mentorFeedback.mentorName}
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded">
                        Score: {mod.mentorFeedback.score} / 100
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic">
                      &ldquo;{mod.mentorFeedback.comment}&rdquo;
                    </p>
                  </div>
                )}

                {/* Submission Action */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedModule(mod);
                      setSubmissionCode(mod.submittedCode || '');
                      setSubmissionNotes(mod.submissionNotes || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
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
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Cohort Competency Mastery
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Evaluation index across core technical competency domains updated via mentor sign-offs.
              </p>
            </div>

            <div className="space-y-4">
              {competencies.map((comp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{comp.label}</span>
                    <span className="font-mono font-bold text-blue-600">{comp.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-700"
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Graduation Criteria:</span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Interns must attain &gt;85% overall average score and complete all pipeline assignments to qualify for full-time junior consultant roles at Kapate Consultancy.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* CODE SUBMISSION MODAL */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Submit Deliverable: {selectedModule.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Module Code: {selectedModule.id}</p>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Source Code Implementation (Python / TypeScript / C++)
                </label>
                <textarea
                  rows={8}
                  required
                  value={submissionCode}
                  onChange={(e) => setSubmissionCode(e.target.value)}
                  placeholder="# Paste complete modular solution here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-emerald-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Architectural Write-Up & Benchmark Results
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Explain runtime metrics, asymptotic complexity, or mathematical derivations..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border-2 border-amber-300 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="text-center space-y-3 pb-6 border-b border-slate-200 relative z-10">
              <div className="flex items-center justify-center gap-3">
                <img src="/logo.png" alt="Kapate Consultancy" className="h-10 object-contain" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">
                Kapate Consultancy • Enterprise AI & Engineering Academy
              </h2>
              <h1 className="text-2xl lg:text-3xl font-serif font-black text-slate-900">
                Certificate of Technical Mastery
              </h1>
              <p className="text-xs text-slate-500">
                This verified credential confirms that
              </p>
              <div className="text-xl font-bold text-slate-900 underline decoration-amber-500/60 underline-offset-8">
                {currentUser.name}
              </div>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                has demonstrated exceptional competence in the rigorous engineering cohort, completing assigned pipelines across <strong>Anti-Money Laundering Detection</strong>, <strong>Algorithmic Complexity Optimization</strong>, and <strong>Multi-Layer Neural Architectures</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-500 relative z-10">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Verification Hash</span>
                <span className="text-slate-800 text-[11px] truncate block font-bold">KC-CERT-2026-9F81E04B72</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
                <span className="text-slate-800 text-[11px] block font-bold">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 relative z-10">
              <div className="text-left">
                <div className="font-serif font-bold text-slate-900 text-sm">Shon Kapate</div>
                <div className="text-[10px] text-slate-500 font-mono">Founder & CEO, Kapate Consultancy</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    showToast('Certificate PDF ready for download!', 'success');
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
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

export default InternLearningHub;
