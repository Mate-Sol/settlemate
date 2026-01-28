import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const OnboardingLayout = ({ children, currentStep, totalSteps, stepTitles, onNext, onBack, isLastStep, isSubmitting }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-brand-purple" />
            <span className="text-xl font-bold text-gradient">CredMate</span>
          </div>
          <span className="text-sm text-gray-500">PSP Registration</span>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      index < currentStep 
                        ? 'bg-brand-gradient text-white' 
                        : index === currentStep 
                          ? 'bg-brand-gradient text-white ring-4 ring-brand-purple/20' 
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`text-xs mt-2 ${index <= currentStep ? 'text-brand-purple font-medium' : 'text-gray-400'}`}>
                    {title}
                  </span>
                </div>
                {index < totalSteps - 1 && (
                  <div 
                    className={`w-20 h-1 mx-2 rounded ${
                      index < currentStep ? 'bg-brand-gradient' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onBack}
            className={`btn-secondary flex items-center gap-2 ${currentStep === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className="btn-brand flex items-center gap-2"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : isLastStep ? (
              'Complete Registration'
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default OnboardingLayout;
