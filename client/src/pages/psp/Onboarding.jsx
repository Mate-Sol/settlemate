import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet, FileText, LogOut, UserPlus, Save, Loader2, AlertCircle, ArrowRight, CheckCircle, InfoIcon } from 'lucide-react';
import CompanyInfo from './onboarding/CompanyInfo';
import BusinessOperations from './onboarding/BusinessOperations';
import FinancialInfo from './onboarding/FinancialInfo';
import RiskLegalInfo from './onboarding/RiskLegalInfo';
import { pspAPI } from '../../services/api';

const Onboarding = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    registrationNo: '',
    country: '',
    yearEstablished: '',
    contactName: '',
    contactPosition: '',
    contactEmail: '',
    contactPhone: '',
    uboName: '',
    uboOwnership: '',
    isPEP: false,

    // Business Operations
    sector: '',
    transactionVolume: '',
    products: [''],
    customers: [''],
    suppliers: [''],

    // Financial Info
    annualRevenue: '',
    projectedRevenue: '',
    profitMargin: '',
    monthlyCashFlow: '',
    primaryBank: '',
    bankAccountNo: '',
    swiftCode: '',
    hasDefaultHistory: false,
    defaultDetails: '',
    currentAllocation: '',
    rolledOutCreditLines: '',
    walletAddress: '',

    // Documents (for upload)
    documents: {},
    // Existing documents (metadata)
    docData: {}
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await pspAPI.getProfile();
        const data = response.data;
        setProfile(data);

        // Map documents into docData for pre-filling
        const docData = {};
        if (data.documents) {
          // Map backend documents to the keys used in frontend components
          const keyMap = {
            'tradeLicense': 'Trade License / Commercial Registration',
            'moaAoa': 'MOA / AOA',
            'uboPassports': 'Passport/Emirates ID of all UBOs',
            'vatCert': 'VAT Certificate & Filing',
            'regulatoryLicense': 'Regulatory license',
            'settlementReports': 'Daily settlement volume reports',
            'ageingAnalysis': 'Ageing analysis of payables/receivables',
            'bankStatements': 'Latest 6 months bank statements',
            'auditedFinancials': 'Audited financial statements',
            'managementAccounts': 'Management Accounts (YTD)',
            'cashFlowStatements': 'Cash flow statements',
            'debtAgreements': 'Existing debt/facility agreements',
            'liensPledges': 'Existing liens or pledges on receivables',
            'flowOfFunds': 'Flow of Funds'
          };

          // Reverse mapping or direct check
          data.documents.forEach(doc => {
            const frontendKey = Object.keys(keyMap).find(key => keyMap[key] === doc.documentType);
            if (frontendKey) {
              docData[frontendKey] = doc;
            }
          });
        }

        setFormData({
          companyName: data.companyName || '',
          registrationNo: data.registrationNo || '',
          country: data.country || '',
          yearEstablished: data.yearEstablished?.toString() || '',
          contactName: data.keyContact?.name || '',
          contactPosition: data.keyContact?.position || '',
          contactEmail: data.keyContact?.email || '',
          contactPhone: data.keyContact?.phone || '',
          uboName: data.uboDetails?.split(' - ')[0] || '',
          uboOwnership: data.uboDetails?.match(/\d+/)?.[0] || '',
          isPEP: data.pepExposure || false,
          sector: data.sector || '',
          transactionVolume: data.transactionVolume || '',
          products: data.keyProducts?.length > 0 ? data.keyProducts : [''],
          customers: data.topCustomers?.length > 0 ? data.topCustomers : [''],
          suppliers: data.topSuppliers?.length > 0 ? data.topSuppliers : [''],
          annualRevenue: data.annualRevenue?.toString() || '',
          projectedRevenue: data.projectedRevenue?.toString() || '',
          profitMargin: data.profitMargin?.toString() || '',
          monthlyCashFlow: data.monthlyCashFlow?.toString() || '',
          primaryBank: data.primaryBank || '',
          bankAccountNo: '',
          swiftCode: '',
          hasDefaultHistory: !!data.defaultHistory && data.defaultHistory !== 'No default history',
          defaultDetails: data.defaultHistory === 'No default history' ? '' : data.defaultHistory || '',
          currentAllocation: data.currentAllocation?.toString() || '',
          rolledOutCreditLines: data.rolledOutCreditLines?.toString() || '',
          walletAddress: data.walletAddress || '',
          documents: {},
          docData: docData
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // 1. Upload any new documents first
      const docKeys = Object.keys(formData.documents);
      if (docKeys.length > 0) {
        const uploadPromises = docKeys.map(key =>
          pspAPI.uploadDocument(formData.documents[key])
        );
        await Promise.all(uploadPromises);
      }

      // 2. Update Profile data
      const payload = {
        companyName: formData.companyName,
        registrationNo: formData.registrationNo,
        country: formData.country,
        yearEstablished: parseInt(formData.yearEstablished),
        keyContact: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone
        },
        uboDetails: `${formData.uboName} - ${formData.uboOwnership}% ownership`,
        pepExposure: formData.isPEP,
        sector: formData.sector,
        transactionVolume: formData.transactionVolume,
        keyProducts: formData.products.filter(p => p.trim() !== ''),
        topCustomers: formData.customers.filter(c => c.trim() !== ''),
        topSuppliers: formData.suppliers.filter(s => s.trim() !== ''),
        annualRevenue: parseFloat(formData.annualRevenue),
        projectedRevenue: parseFloat(formData.projectedRevenue),
        profitMargin: parseFloat(formData.profitMargin),
        monthlyCashFlow: parseFloat(formData.monthlyCashFlow),
        primaryBank: formData.primaryBank,
        currentAllocation: parseFloat(formData.currentAllocation),
        walletAddress: formData.walletAddress,
        rolledOutCreditLines: parseFloat(formData.rolledOutCreditLines),
        defaultHistory: formData.hasDefaultHistory ? formData.defaultDetails : 'No default history'
      };

      await pspAPI.updateProfile(payload);
      setSaved(true);

      // Refresh docData after save to show updated names
      const response = await pspAPI.getProfile();
      const updatedData = response.data;
      const newDocData = {};
      if (updatedData.documents) {
        const keyMap = {
          'tradeLicense': 'Trade License / Commercial Registration',
          'moaAoa': 'MOA / AOA',
          'uboPassports': 'Passport/Emirates ID of all UBOs',
          'vatCert': 'VAT Certificate & Filing',
          'regulatoryLicense': 'Regulatory license',
          'settlementReports': 'Daily settlement volume reports',
          'ageingAnalysis': 'Ageing analysis of payables/receivables',
          'bankStatements': 'Latest 6 months bank statements',
          'auditedFinancials': 'Audited financial statements',
          'managementAccounts': 'Management Accounts (YTD)',
          'cashFlowStatements': 'Cash flow statements',
          'debtAgreements': 'Existing debt/facility agreements',
          'liensPledges': 'Existing liens or pledges on receivables',
          'flowOfFunds': 'Flow of Funds'
        };
        updatedData.documents.forEach(doc => {
          const frontendKey = Object.keys(keyMap).find(key => keyMap[key] === doc.documentType);
          if (frontendKey) newDocData[frontendKey] = doc;
        });
      }

      setFormData(prev => ({ ...prev, documents: {}, docData: newDocData }));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Info' },
    { id: 'business', label: 'Business' },
    { id: 'financial', label: 'Financial' },
    { id: 'risk', label: 'Risk & Legal' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={"/logo-white.png"} alt="logo" className='h-20 ' />
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <a href="/psp/dashboard" className="sidebar-link">
            <TrendingUp className="w-5 h-5" />
            Dashboard
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {profile?.creditLineStatus === 'NeedMoreInfo' && profile.cadMessage && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Message from Credit Approval Department</h3>
                <p className="text-amber-800 text-sm mt-1">{profile.cadMessage}</p>
                <p className="text-amber-700 text-xs mt-2 italic">Please update your company profile information below as requested.</p>
              </div>
            </div>
          )}
          {profile?.creditLineStatus === 'Approved' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-800 text-sm mt-1">Your credit line has been approved.</p>
                <p className="text-green-700 text-xs mt-2 italic">You can now proceed to application.</p>
              </div>
            </div>
          )}
          {profile?.creditLineStatus === 'Pending' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <InfoIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-blue-800 text-sm mt-1">Your credit line is pending.</p>
                <p className="text-blue-700 text-xs mt-2 italic">You will be notified once it is approved.</p>
              </div>
            </div>
          )}

          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="page-header">Company Profile</h1>
              <p className="text-gray-600">Manage your company information and KYC details</p>
            </div>
            <div className="flex gap-3">
              {/* {(profile?.creditLineStatus === 'NeedMoreInfo' || profile?.creditLineStatus === 'None' || (profile?.creditLineStatus === 'Approved' && profile?.assignedPoolAddress)) && ( */}
              {(profile?.creditLineStatus === 'NeedMoreInfo' || profile?.creditLineStatus === 'None') && (
                <button
                  onClick={() => navigate('/psp/apply-limit')}
                  className="px-6 py-3 rounded-lg font-semibold border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white transition-all flex items-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  Proceed to Application
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || loading}
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
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition-colors relative ${activeTab === tab.id
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
            {activeTab === 'risk' && (
              <RiskLegalInfo data={formData} onChange={updateFormData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
