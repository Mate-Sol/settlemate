import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pspAPI } from '../../services/api';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import CompanyInfo from './onboarding/CompanyInfo';
import BusinessOperations from './onboarding/BusinessOperations';
import FinancialInfo from './onboarding/FinancialInfo';
import RiskLegalInfo from './onboarding/RiskLegalInfo';

const Register = () => {
  const navigate = useNavigate();
  const { register, user: authUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Auth credentials
    email: '',
    password: '',
    name: '',

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
    rolledOutCreditLines: '',
    primaryBank: '',
    currentAllocation: '',
    walletAddress: '',
    hasDefaultHistory: false,
    defaultDetails: '',

    // Documents (stored as { docKey: { category, name, fileContent, fileType, fileSize } })
    documents: {}
  });

  const stepTitles = ['Company Info', 'Business', 'Financial', 'Risk & Legal'];
  const totalSteps = stepTitles.length;

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const uploadStepDocuments = async (docKeys) => {
    const uploadPromises = docKeys
      .filter(key => formData.documents[key])
      .map(key => pspAPI.uploadDocument(formData.documents[key]));

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (currentStep === 0) {
        // Step 1: Register User and Profile
        if (!authUser) {
          const result = await register({
            email: formData.contactEmail || formData.email,
            password: formData.password || 'demo123',
            name: formData.contactName || formData.companyName,
            companyName: formData.companyName,
            registrationNo: formData.registrationNo,
            country: formData.country,
            yearEstablished: formData.yearEstablished,
            contactName: formData.contactName,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            uboDetails: `${formData.uboName} - ${formData.uboOwnership}% ownership`,
            pepExposure: formData.isPEP,
          });

          if (!result.success) {
            throw new Error(result.error || 'Registration failed');
          }
        } else {
          // If already registered (e.g., clicked back and then next), just update profile
          await pspAPI.updateProfile({
            companyName: formData.companyName,
            registrationNo: formData.registrationNo,
            country: formData.country,
            yearEstablished: formData.yearEstablished,
            keyContact: {
              name: formData.contactName,
              email: formData.contactEmail,
              phone: formData.contactPhone
            },
            uboDetails: `${formData.uboName} - ${formData.uboOwnership}% ownership`,
            pepExposure: formData.isPEP,
          });
        }

        // Upload Step 1 documents
        await uploadStepDocuments(['tradeLicense', 'moaAoa', 'uboPassports', 'vatCert', 'regulatoryLicense']);

        setCurrentStep(1);
      } else if (currentStep === 1) {
        // Step 2: Business Operations
        await pspAPI.updateProfile({
          sector: formData.sector,
          transactionVolume: formData.transactionVolume,
          keyProducts: formData.products.filter(p => p.trim() !== ''),
          topCustomers: formData.customers.filter(c => c.trim() !== ''),
          topSuppliers: formData.suppliers.filter(s => s.trim() !== ''),
        });

        // Upload Step 2 documents
        await uploadStepDocuments(['settlementReports', 'ageingAnalysis']);

        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Step 3: Financial Info
        await pspAPI.updateProfile({
          annualRevenue: formData.annualRevenue,
          projectedRevenue: formData.projectedRevenue,
          profitMargin: formData.profitMargin,
          monthlyCashFlow: formData.monthlyCashFlow,
          rolledOutCreditLines: formData.rolledOutCreditLines,
          primaryBank: formData.primaryBank,
          currentAllocation: formData.currentAllocation,
          walletAddress: formData.walletAddress,
          defaultHistory: formData.hasDefaultHistory ? formData.defaultDetails : 'No default history'
        });

        // Upload Step 3 documents
        await uploadStepDocuments(['bankStatements', 'auditedFinancials', 'managementAccounts', 'cashFlowStatements']);

        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Step 4: Risk & Legal
        // Risk & Legal currently only has documents, but we could add more profile fields here if needed

        // Upload Step 4 documents
        await uploadStepDocuments(['debtAgreements', 'liensPledges', 'flowOfFunds']);

        // Finalize
        navigate('/psp/apply-limit');
      }
    } catch (err) {
      console.error('Step processing failed:', err);
      setError(err.message || 'Processing failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <CompanyInfo data={formData} onChange={updateFormData} />;
      case 1:
        return <BusinessOperations data={formData} onChange={updateFormData} />;
      case 2:
        return <FinancialInfo data={formData} onChange={updateFormData} />;
      case 3:
        return <RiskLegalInfo data={formData} onChange={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepTitles={stepTitles}
      onNext={handleNext}
      onBack={handleBack}
      isLastStep={currentStep === totalSteps - 1}
      isSubmitting={isSubmitting}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}
      {renderStep()}
    </OnboardingLayout>
  );
};

export default Register;
