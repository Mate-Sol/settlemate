import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet, FileText, LogOut, UserPlus, Save, Loader2 } from 'lucide-react';
import CompanyInfo from './onboarding/CompanyInfo';
import BusinessOperations from './onboarding/BusinessOperations';
import FinancialInfo from './onboarding/FinancialInfo';

const Onboarding = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    // Company Info
    companyName: 'Acme Payments',
    registrationNo: '12345678',
    country: 'UK',
    yearEstablished: '2020',
    contactName: 'John Smith',
    contactPosition: 'CEO',
    contactEmail: 'john@acmepayments.com',
    contactPhone: '+44 20 1234 5678',
    uboName: 'John Smith',
    uboOwnership: '100',
    isPEP: false,
    
    // Business Operations
    sector: 'Payment Processing',
    transactionVolume: '1m-5m',
    products: ['Payment Gateway', 'Invoice Processing'],
    customers: ['TechCorp Inc', 'Global Retail'],
    suppliers: ['Visa', 'Mastercard'],
    
    // Financial Info
    annualRevenue: '5000000',
    projectedRevenue: '7500000',
    profitMargin: '15',
    monthlyCashFlow: '500000',
    outstandingLoans: '0',
    primaryBank: 'Barclays',
    bankAccountNo: '12345678',
    swiftCode: 'BARCGB22',
    hasDefaultHistory: false,
    defaultDetails: '',
  });

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'company', label: 'Company Info' },
    { id: 'business', label: 'Business Operations' },
    { id: 'financial', label: 'Financial Info' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
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
          <a href="/psp/order-book" className="sidebar-link">
            <FileText className="w-5 h-5" />
            Order Book
          </a>
          {/* <a href="/psp/wallet" className="sidebar-link">
            <Wallet className="w-5 h-5" />
            Wallet
          </a> */}
          <a href="/psp/onboarding" className="sidebar-link active">
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

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="page-header">Company Profile</h1>
              <p className="text-gray-600">Manage your company information and KYC details</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn-brand flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Save className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id 
                    ? 'text-brand-purple' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gradient" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="card">
            {activeTab === 'company' && (
              <CompanyInfo data={formData} onChange={updateFormData} />
            )}
            {activeTab === 'business' && (
              <BusinessOperations data={formData} onChange={updateFormData} />
            )}
            {activeTab === 'financial' && (
              <FinancialInfo data={formData} onChange={updateFormData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
