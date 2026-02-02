import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import CompanyInfo from './onboarding/CompanyInfo';
import BusinessOperations from './onboarding/BusinessOperations';
import FinancialInfo from './onboarding/FinancialInfo';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Auth credentials (collected in first step)
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
  });

  const stepTitles = ['Company Info', 'Business', 'Financial'];
  const totalSteps = stepTitles.length;

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final submission
      setIsSubmitting(true);
      setError('');
      try {
        // Register user with backend - send ALL form data
        const result = await register({
          // Auth credentials
          email: formData.contactEmail || formData.email,
          password: formData.password || 'demo123', // User should set this in CompanyInfo step
          name: formData.contactName || formData.companyName,

          // Company info
          companyName: formData.companyName,
          registrationNo: formData.registrationNo,
          country: formData.country,
          yearEstablished: formData.yearEstablished,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          uboDetails: `${formData.uboName} - ${formData.uboOwnership}% ownership`,
          pepExposure: formData.isPEP,

          // Business operations
          sector: formData.sector,
          transactionVolume: formData.transactionVolume,
          keyProducts: formData.products.filter(p => p.trim() !== ''),
          topCustomers: formData.customers.filter(c => c.trim() !== ''),
          topSuppliers: formData.suppliers.filter(s => s.trim() !== ''),

          // Financial info
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

        if (result.success) {
          // Redirect to apply financing limit after successful registration
          navigate('/psp/apply-limit');
        } else {
          setError(result.error || 'Registration failed');
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Registration failed:', error);
        setError('Registration failed. Please try again.');
        setIsSubmitting(false);
      }
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
      {renderStep()}
    </OnboardingLayout>
  );
};

export default Register;
