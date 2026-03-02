import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, Users, FileCheck, AlertTriangle, LogOut, ArrowLeft, CheckCircle, Clock, XCircle, Building, DollarSign, Calendar, FileText, Download, Loader2 } from 'lucide-react';
import { croAPI } from '../../../services/api';

const ApplicationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  console.log(application);
  // Decision form data
  const [decisionData, setDecisionData] = useState({
    approvedAmount: '',
    approvedDuration: '',
    walletAddress: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await croAPI.getApplication(id);
      setApplication(response.data);

      // Pre-fill approval form with requested amounts
      setDecisionData(prev => ({
        ...prev,
        approvedAmount: response.data.requestedAmount || '',
        approvedDuration: response.data.requestedDuration || '',
        walletAddress: response.data.walletAddress || '',
        notes: response.data.notes || ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (docId, fileName) => {
    try {
      const response = await croAPI.getDocumentContent(docId);
      const { fileContent, fileType } = response.data;

      // Create blob from base64
      const byteCharacters = atob(fileContent.split(',')[1] || fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileType });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download document: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDecision = (type) => {
    setDecision(type);
    setShowDecisionModal(true);
  };

  const submitDecision = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (decision === 'approve') {
        await croAPI.approveApplication(id, {
          approvedAmount: parseFloat(decisionData.approvedAmount),
          approvedDuration: parseInt(decisionData.approvedDuration),
          walletAddress: decisionData.walletAddress,
          notes: decisionData.notes
        });
        alert('Application approved! Smart contract deployment initiated.');
      } else if (decision === 'reject') {
        await croAPI.rejectApplication(id, {
          notes: decisionData.notes
        });
        alert('Application rejected.');
      } else if (decision === 'request-info') {
        await croAPI.requestInfo(id, {
          notes: decisionData.notes
        });
        alert('Additional information requested.');
      }

      // Navigate back to dashboard
      navigate('/admin/cro');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit decision');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading application</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/admin/cro')} className="btn-brand">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={"/logo-white.png"} alt="logo" className='h-20' />
          </div>
          <span className="text-xs text-white/60 mt-1 block">CRO Admin</span>
        </div>

        <nav className="p-4 space-y-2">
          <a href="/admin/cro" className="sidebar-link">
            <Users className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/admin/cro/applications" className="sidebar-link active">
            <FileCheck className="w-5 h-5" />
            Applications
          </a>
          <a href="/admin/cro/overdue" className="sidebar-link">
            <AlertTriangle className="w-5 h-5" />
            Overdue
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="sidebar-link w-full justify-start text-white/60 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/cro')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Applications
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="page-header mb-1">{application.companyName}</h1>
                <p className="text-gray-600">Credit Line Application Review</p>
              </div>
              <span className="badge badge-warning">{application.creditLineStatus}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'profile'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('scoring')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'scoring'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Credit Scoring
            </button>
          </div>

          {activeTab === 'profile' ? (
            <>
              {/* Application Summary */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="stats-card">
                  <DollarSign className="w-5 h-5 text-brand-purple mb-2" />
                  <span className="stats-label">Requested Amount</span>
                  <span className="stats-value text-gradient">{formatCurrency(application.requestedAmount)}</span>
                </div>
                <div className="stats-card">
                  <Calendar className="w-5 h-5 text-brand-purple mb-2" />
                  <span className="stats-label">Duration</span>
                  <span className="stats-value">{application.requestedDuration} Days</span>
                </div>
                <div className="stats-card">
                  <Building className="w-5 h-5 text-brand-purple mb-2" />
                  <span className="stats-label">Annual Revenue</span>
                  <span className="stats-value">{formatCurrency(application.annualRevenue)}</span>
                </div>
              </div>

              {/* Company Information */}
              <div className="card mb-6">
                <h2 className="text-lg font-semibold mb-4">Company Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{application.registrationNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium">{application.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Year Established</p>
                    <p className="font-medium">{application.yearEstablished}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Sector</p>
                    <p className="font-medium">{application.sector}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transaction Volume</p>
                    <p className="font-medium">{application.transactionVolume}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted Date</p>
                    <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="card mb-6">
                <h2 className="text-lg font-semibold mb-4">Key Contact Person</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{application.keyContact?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{application.keyContact?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{application.keyContact?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="card mb-8">
                <h2 className="text-lg font-semibold mb-6">Submitted Documents</h2>

                {['Company Identity & Legal', 'Operational Settlement Data', 'Financials & Banking', 'Risk & Legal'].map((category) => {
                  const categoryDocs = application?.documents?.filter(doc => doc.category === category) || [];
                  if (categoryDocs.length === 0) return null;

                  return (
                    <div key={category} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{category}</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {categoryDocs.map((doc) => (
                          <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="w-5 h-5 text-brand-purple shrink-0" />
                              <div className="overflow-hidden">
                                <p className="font-medium text-sm truncate" title={doc.documentType || doc.name}>
                                  {doc.documentType || doc.name}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate" title={doc.name}>
                                  {doc.name}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadDocument(doc._id, doc.name)}
                              className="flex items-center gap-2 text-brand-purple hover:underline shrink-0 text-sm font-semibold"
                            >
                              <Download className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {(!application?.documents || application.documents.length === 0) && (
                  <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-lg">
                    No documents submitted with this application.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <CreditScoringTab application={application} onUpdate={fetchApplication} />
              {/* Decision Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleDecision('approve')}
                  className="btn-brand flex items-center gap-2 flex-1"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Application
                </button>
                <button
                  onClick={() => handleDecision('request-info')}
                  className="btn-secondary flex items-center gap-2 flex-1"
                >
                  <Clock className="w-5 h-5" />
                  Request More Info
                </button>
                <button
                  onClick={() => handleDecision('reject')}
                  className="px-6 py-3 rounded-lg font-semibold border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 flex-1"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Application
                </button>
              </div>
            </>
          )}


        </div>
      </main>

      {/* Decision Modal */}
      {showDecisionModal && (
        <DecisionModal
          decision={decision}
          application={application}
          decisionData={decisionData}
          setDecisionData={setDecisionData}
          submitting={submitting}
          error={error}
          onClose={() => {
            setShowDecisionModal(false);
            setError(null);
          }}
          onConfirm={submitDecision}
        />
      )}
    </div>
  );
};

// Decision Modal Component
const DecisionModal = ({ decision, application, decisionData, setDecisionData, submitting, error, onClose, onConfirm }) => {
  const modalConfig = {
    approve: {
      title: 'Approve Application',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      bgColor: 'bg-green-100',
      message: 'You are about to approve this credit line application. Upon approval, a dedicated CreditLine Pool smart contract will be deployed on Sepolia testnet.',
      buttonText: 'Confirm Approval & Deploy Contract',
      buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    'request-info': {
      title: 'Request Additional Information',
      icon: <Clock className="w-8 h-8 text-amber-600" />,
      bgColor: 'bg-amber-100',
      message: 'Request more information from the applicant. They will be notified via email.',
      buttonText: 'Send Request',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
    reject: {
      title: 'Reject Application',
      icon: <XCircle className="w-8 h-8 text-red-600" />,
      bgColor: 'bg-red-100',
      message: 'You are about to reject this credit line application. This action cannot be undone.',
      buttonText: 'Confirm Rejection',
      buttonClass: 'bg-red-600 hover:bg-red-700',
    },
  };

  const config = modalConfig[decision];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {config.icon}
          </div>

          <h2 className="text-xl font-bold text-center mb-2">{config.title}</h2>
          <p className="text-center text-gray-600 mb-2">{application.companyName}</p>
          <p className="text-center text-sm text-gray-500 mb-6">{config.message}</p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {decision === 'approve' && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Approved Amount (USD) *</label>
                  <input
                    type="number"
                    value={decisionData.approvedAmount}
                    onChange={(e) => setDecisionData(prev => ({ ...prev, approvedAmount: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Duration (Days) *</label>
                  <input
                    type="number"
                    value={decisionData.approvedDuration}
                    onChange={(e) => setDecisionData(prev => ({ ...prev, approvedDuration: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label">PSP Wallet Address (for contract deployment) *</label>
                <input
                  type="text"
                  value={decisionData.walletAddress}
                  onChange={(e) => setDecisionData(prev => ({ ...prev, walletAddress: e.target.value }))}
                  className="input-field font-mono text-sm"
                  placeholder="0x..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Contract will be deployed with this address as the borrower</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="input-label">Notes {decision !== 'approve' && '*'}</label>
            <textarea
              value={decisionData.notes}
              onChange={(e) => setDecisionData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-field min-h-[100px]"
              placeholder={decision === 'request-info' ? "Specify what information is needed..." : "Add internal notes..."}
              required={decision !== 'approve'}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting || (decision === 'approve' && (!decisionData.walletAddress || !decisionData.approvedAmount)) || (decision !== 'approve' && !decisionData.notes)}
              className={`${config.buttonClass} text-white px-6 py-3 rounded-lg font-semibold transition-all flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                config.buttonText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreditScoringTab = ({ application, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState({});

  useEffect(() => {
    if (application?.creditScoring?.criteriaScores) {
      setScores(application.creditScoring.criteriaScores);
    }
  }, [application?.creditScoring?.totalScore]);

  const criteria = [
    {
      id: 1,
      name: 'Incorporation Type & Regulatory Standing',
      maxScore: 5,
      subCriteria: [
        'Licensed Money Exchange / Remittance Company (Central Bank licensed) (5)',
        'Licensed FinTech / PSP with remittance approval (4)',
        'Unlicensed but operating under agent model (2)',
        'No formal license / unregulated (0)'
      ]
    },
    {
      id: 2,
      name: 'Business Age & Track Record',
      maxScore: 5,
      subCriteria: [
        '5 Years > (5)',
        '3 to 5 Years (4)',
        '1 to 3 Years (2)',
        '< 1 Year (0)'
      ]
    },
    {
      id: 3,
      name: 'Transaction Volume & Velocity',
      maxScore: 10,
      subCriteria: [
        'Monthly transactions > AED 50M (10)',
        'AED 20M – 50M monthly (7)',
        'AED 5M – 20M monthly (4)',
        '< AED 5M monthly (1)'
      ]
    },
    {
      id: 4,
      name: 'Settlement Partner Quality',
      maxScore: 10,
      subCriteria: [
        'Tier 1: Licensed bank or top-5 exchange house (e.g., Lulu, Al Ansari) (10)',
        'Tier 2: Mid-tier licensed exchange (7)',
        'Tier 3: Regional licensed player (4)',
        'Tier 4: Unlicensed / Small individual aggregator (0)'
      ]
    },
    {
      id: 5,
      name: 'Corridor & Remittance Risk',
      maxScore: 8,
      subCriteria: [
        'Low-risk (GCC, US, EU, UK, SG, AU) (8)',
        'Mixed portfolio (Medium-risk corridors) (6)',
        'High-risk / Emerging markets focus (3)',
        'Sanctioned / Gray list corridors (0)'
      ]
    },
    {
      id: 6,
      name: 'Prefunding Cycle & Liquidity Management',
      maxScore: 8,
      subCriteria: [
        'Settlement within < 24 hrs (8)',
        '24 to 48 hrs (6)',
        '48 to 72 hrs (3)',
        'Poor liquidity controls / No fixed cycle (0)'
      ]
    },
    {
      id: 7,
      name: 'Historical Transaction Data & Audit Trail',
      maxScore: 8,
      subCriteria: [
        '3+ Years audited / verified data (8)',
        '1 to 3 Years partially audited (5)',
        '< 1 Year or unaudited internal logs (2)',
        'No historical transaction logs (0)'
      ]
    },
    {
      id: 8,
      name: 'Bank Statement & Float Management',
      maxScore: 7,
      subCriteria: [
        'Excellent - Consistent float & no defaults (7)',
        'Good - Minor gaps in float (5)',
        'Average - High utilization (2)',
        'Poor - Frequent overdrafts / returns (0)'
      ]
    },
    {
      id: 9,
      name: 'Financial Statement Analysis',
      maxScore: 10,
      subCriteria: [
        'Excellent (High revenue + Healthy margins) (10)',
        'Good (Growth trend + Managed debt) (7)',
        'Average (Stable revenue + Thin margins) (4)',
        'Poor (Declining revenue / Heavy losses) (0)'
      ]
    },
    {
      id: 10,
      name: 'AML / Compliance & Regulatory Health',
      maxScore: 8,
      subCriteria: [
        'Robust framework (Audited annually) (8)',
        'Adequate internal controls (5)',
        'Weak / Manual monitoring (2)',
        'Sanctions/Legal flags (0)'
      ]
    },
    {
      id: 11,
      name: 'Technology & Integration Readiness',
      maxScore: 5,
      subCriteria: [
        'Real-time API integration (5)',
        'Semi-automated dashboard (3)',
        'Manual reporting / Excel (1)',
        'None (0)'
      ]
    },
    {
      id: 12,
      name: 'Guarantors / Collateral / Security',
      maxScore: 5,
      subCriteria: [
        'Strong corporate/bank guarantee (5)',
        'Personal guarantee + PDC (3)',
        'Partial collateral (1)',
        'None (0)'
      ]
    },
    {
      id: 13,
      name: 'Previous Financing Payback Trend',
      maxScore: 7,
      subCriteria: [
        'Excellent - Always on time (7)',
        'Good - Minor delays (< 3 days) (5)',
        'Average - Consistent late payments (2)',
        'Poor - Previous defaults (0)'
      ]
    },
    {
      id: 14,
      name: 'Credit Bureau / Banking Reference',
      maxScore: 4,
      subCriteria: [
        'Excellent Reference (4)',
        'Good Reference (3)',
        'Average / New relationship (1)',
        'Poor / Rejected by banks (0)'
      ]
    },
  ];

  const totalScore = criteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);

  const getRating = (score) => {
    if (score >= 85) return { label: 'AAA', desc: 'Excellent | Immediate Approval', color: 'text-green-600' };
    if (score >= 70) return { label: 'AA', desc: 'Good | Approval with Standard Terms', color: 'text-blue-600' };
    if (score >= 55) return { label: 'A', desc: 'Satisfactory | Approval with Enhanced Monitoring', color: 'text-yellow-600' };
    if (score >= 40) return { label: 'B', desc: 'Moderate Risk | Conditional Approval / Reduced Limit', color: 'text-orange-600' };
    return { label: 'C', desc: 'High Risk | Decline or Extensive Collateral Required', color: 'text-red-600' };
  };

  const currentRating = getRating(totalScore);

  const handleScoreChange = (id, value, max) => {
    const val = Math.min(max, Math.max(0, Number(value) || 0));
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await croAPI.saveCreditScore(application._id, {
        criteriaScores: scores,
        totalScore,
        percentage: totalScore,
        rating: currentRating.label
      });
      alert('Credit score saved successfully!');
      onUpdate();
    } catch (err) {
      alert('Failed to save credit score: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b">#</th>
                <th className="px-4 py-3 border-b">Criteria</th>
                <th className="px-4 py-3 border-b">Max Score</th>
                <th className="px-4 py-3 border-b">Sub-Criteria / Rating Scale</th>
                <th className="px-4 py-3 border-b text-center">Achieved Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {criteria.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400">{c.id}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 w-48">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.maxScore}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-600 font-medium">
                    <ul className="list-disc list-inside space-y-0.5">
                      {c.subCriteria.map((item, index) => (
                        <li key={index} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max={c.maxScore}
                      value={scores[c.id] || ''}
                      onChange={(e) => handleScoreChange(c.id, e.target.value, c.maxScore)}
                      className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-bold focus:ring-2 focus:ring-brand-purple outline-none text-center mx-auto"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-brand-purple/5 font-bold">
                <td colSpan="2" className="px-4 py-4 text-brand-purple text-xs">TOTAL CREDIT SCORE</td>
                <td className="px-4 py-4 text-brand-purple text-xs">100</td>
                <td className="px-4 py-4 border-none"></td>
                <td className="px-4 py-4 text-brand-purple text-base text-center bg-brand-purple/10 border-t-2 border-brand-purple">{totalScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-brand-gradient text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Final Evaluation</h3>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold">{totalScore}%</span>
              <span className="text-xl mb-1 opacity-90">Score Matrix</span>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">Rating: {currentRating.label}</div>
                <p className="text-xs opacity-80 mt-1">{currentRating.desc}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                {currentRating.label[0]}
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-brand-purple" />
            Rating Legend
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { range: '85 – 100', rank: 'AAA', desc: 'Immediate Approval', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
              { range: '70 – 84', rank: 'AA', desc: 'Standard Terms', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
              { range: '55 – 69', rank: 'A', desc: 'Enhanced Monitoring', bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700' },
              { range: '40 – 54', rank: 'B', desc: 'Conditional / Reduced', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
              { range: '< 40', rank: 'C', desc: 'Decline / Collateral', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-2 ${item.bg} rounded border ${item.border} text-[10px]`}>
                <span className={`font-bold ${item.text} w-20`}>{item.range} ({item.rank})</span>
                <span className="text-gray-600 font-medium">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-brand px-10 py-3 flex items-center gap-2 shadow-lg shadow-brand-purple/20 transition-transform hover:scale-[1.02]"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {application.creditScoring?.updatedAt ? 'Update Credit Score' : 'Save Final Credit Score'}
        </button>
      </div>
    </div>
  );
};

export default ApplicationReview;
