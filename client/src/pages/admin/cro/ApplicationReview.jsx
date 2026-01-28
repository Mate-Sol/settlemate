import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CreditCard, Users, FileCheck, AlertTriangle, LogOut, ArrowLeft, CheckCircle, Clock, XCircle, Building, DollarSign, Calendar, FileText, Download } from 'lucide-react';

const ApplicationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState(null);

  // Mock application data - in production would fetch from API
  const application = {
    id: id || '1',
    company: 'Acme Payments Ltd',
    registrationNo: '12345678',
    country: 'United Kingdom',
    yearEstablished: 2020,
    contactName: 'John Smith',
    contactEmail: 'john@acmepayments.com',
    contactPhone: '+44 20 1234 5678',
    sector: 'Payment Processing',
    transactionVolume: '$1M - $5M',
    annualRevenue: 5000000,
    requestedAmount: 500000,
    duration: 90,
    submittedDate: '2026-01-25',
    status: 'Pending',
    documents: [
      { name: 'Certificate of Incorporation.pdf', size: '245 KB', url: '#' },
      { name: 'Financial Statements 2025.pdf', size: '1.2 MB', url: '#' },
      { name: 'Bank Statements.pdf', size: '890 KB', url: '#' },
      { name: 'Director ID - John Smith.pdf', size: '156 KB', url: '#' },
    ]
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            <span className="text-xl font-bold">CredMate</span>
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
                <h1 className="page-header mb-1">{application.company}</h1>
                <p className="text-gray-600">Credit Line Application Review</p>
              </div>
              <span className="badge badge-warning">{application.status}</span>
            </div>
          </div>

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
              <span className="stats-value">{application.duration} Days</span>
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
                <p className="font-medium">{application.submittedDate}</p>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Key Contact Person</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{application.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{application.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{application.contactPhone}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">KYC Documents</h2>
            <div className="space-y-3">
              {application.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand-purple" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <a 
                    href={doc.url}
                    className="flex items-center gap-2 text-brand-purple hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>

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
        </div>
      </main>

      {/* Decision Modal */}
      {showDecisionModal && (
        <DecisionModal 
          decision={decision}
          application={application}
          onClose={() => setShowDecisionModal(false)}
          onConfirm={() => {
            setShowDecisionModal(false);
            navigate('/admin/cro');
          }}
        />
      )}
    </div>
  );
};

// Decision Modal Component
const DecisionModal = ({ decision, application, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    onConfirm();
  };

  const modalConfig = {
    approve: {
      title: 'Approve Application',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      bgColor: 'bg-green-100',
      message: 'You are about to approve this credit line application. Upon approval, a dedicated CreditLine Pool smart contract will be deployed on Sepolia testnet.',
      buttonText: 'Confirm Approval',
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
          <p className="text-center text-gray-600 mb-2">{application.company}</p>
          <p className="text-center text-sm text-gray-500 mb-6">{config.message}</p>

          <div className="mb-6">
            <label className="input-label">Notes {decision !== 'approve' && '*'}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder={decision === 'request-info' ? "Specify what information is needed..." : "Add internal notes..."}
              required={decision !== 'approve'}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || (decision !== 'approve' && !notes)}
              className={`${config.buttonClass} text-white px-6 py-3 rounded-lg font-semibold transition-all flex-1 flex items-center justify-center gap-2`}
            >
              {isSubmitting ? 'Processing...' : config.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;
