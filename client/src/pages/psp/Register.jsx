import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../layouts/OnboardingLayout';
import CompanyInfo from './onboarding/CompanyInfo';
import BusinessOperations from './onboarding/BusinessOperations';
import FinancialInfo from './onboarding/FinancialInfo';

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    outstandingLoans: '',
    primaryBank: '',
    bankAccountNo: '',
    swiftCode: '',
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
      try {
        // TODO: Submit to backend API
        console.log('Submitting registration:', formData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redirect to apply financing limit
        navigate('/psp/apply-limit');
      } catch (error) {
        console.error('Registration failed:', error);
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
