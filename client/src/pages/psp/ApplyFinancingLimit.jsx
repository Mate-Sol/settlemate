import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, DollarSign, Calendar, Upload, FileText, CheckCircle, X, Loader2, AlertCircle, LogOut, UserPlus } from 'lucide-react';
import { pspAPI } from '../../services/api';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ApplyFinancingLimit = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    requestedAmount: '',
    duration: '60',
    purpose: '',
    documents: [],
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await pspAPI.getProfile();
        setProfile(response.data);
        if (response.data.requestedAmount) {
          setFormData(prev => ({
            ...prev,
            requestedAmount: response.data.requestedAmount.toString(),
            duration: (response.data.requestedDuration || 60).toString(),
          }));
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      id: Date.now() + Math.random(),
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Submit application to backend
      await pspAPI.applyForLimit({
        requestedAmount: parseFloat(formData.requestedAmount),
        requestedDuration: parseInt(formData.duration),
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Application failed:', error);
      setError(error.response?.data?.message || 'Application failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="card max-w-lg w-full text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          <p className="text-gray-600 mb-8">
            Your financing limit application is now under review. Our team will assess your application
            and get back to you within 2-3 business days.
          </p>
          <div className="badge badge-warning mx-auto mb-8">
            Status: Under Review
          </div>
          <button
            onClick={() => navigate('/psp/dashboard')}
            className="btn-brand"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for logged in users */}
      {user && (
        <aside className="sidebar">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CreditCard className="w-8 h-8" />
              <span className="text-xl font-bold">CredMate</span>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <a href="/psp/dashboard" className="sidebar-link">
              <TrendingUp className="w-5 h-5" />
              Dashboard
            </a>
            {/* <a href="/psp/order-book" className="sidebar-link">
              <FileText className="w-5 h-5" />
              Order Book
            </a> */}
            <a href="/psp/onboarding" className="sidebar-link">
              <UserPlus className="w-5 h-5" />
              Profile
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
      )}

      {/* Header for guest users */}
      {!user && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-brand-purple" />
              <span className="text-xl font-bold text-gradient">CredMate</span>
            </div>
            <span className="text-sm text-gray-500">Apply for Financing</span>
          </div>
        </header>
      )}

      <main className={`${user ? 'ml-64 p-8' : 'max-w-4xl mx-auto px-6 py-8'}`}>
        <div className={user ? 'max-w-4xl mx-auto' : ''}>
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-gradient rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Apply for Financing Limit</h2>
                <p className="text-gray-500 text-sm">Request your credit line amount and upload documents</p>
              </div>
            </div>

            {profile?.creditLineStatus === 'NeedMoreInfo' && profile.cadMessage && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900">Message from Credit Approval Department</h3>
                  <p className="text-amber-800 text-sm mt-1">{profile.cadMessage}</p>
                  <p className="text-amber-700 text-xs mt-2 italic">Please update the information below and re-submit your application.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Requested Amount (USDC/USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.requestedAmount}
                      onChange={handleChange('requestedAmount')}
                      className="input-field pl-8"
                      placeholder="500,000"
                      min="10000"
                      max="10000000"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum: $10,000 | Maximum: $10,000,000</p>
                </div>

                <div>
                  <label className="input-label">Desired Duration (Days) *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.duration}
                      onChange={handleChange('duration')}
                      className="input-field pl-11"
                      required
                    >
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                      <option value="180">180 Days</option>
                      <option value="365">365 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Purpose of Financing</label>
                <textarea
                  value={formData.purpose}
                  onChange={handleChange('purpose')}
                  className="input-field min-h-[100px]"
                  placeholder="Describe how you plan to use the financing..."
                />
              </div>

              <hr className="my-6" />

              
              

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>What happens next?</strong> After submission, our CRO will review your application.
                  Upon approval, a dedicated Credit Line Pool will be deployed on-chain specifically for your company.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.requestedAmount}
                  className="btn-brand flex items-center gap-2 min-w-[200px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplyFinancingLimit;
