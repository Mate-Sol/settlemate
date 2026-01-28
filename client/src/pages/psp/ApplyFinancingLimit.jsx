import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, Calendar, Upload, FileText, CheckCircle, X, Loader2 } from 'lucide-react';
import { pspAPI } from '../../services/api';

const ApplyFinancingLimit = () => {
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
            onClick={() => navigate('/login')}
            className="btn-brand"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-brand-purple" />
            <span className="text-xl font-bold text-gradient">CredMate</span>
          </div>
          <span className="text-sm text-gray-500">Apply for Financing</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
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

            <h3 className="font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-purple" />
              Required Documents
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Please upload the following documents for KYC verification
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium">• Certificate of Incorporation</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium">• Latest Financial Statements</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium">• Bank Statements (6 months)</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium">• Director ID Documents</span>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-purple transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-400 mt-1">PDF, DOC, or images (max 10MB each)</p>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-4">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-brand-purple" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
      </main>
    </div>
  );
};

export default ApplyFinancingLimit;
