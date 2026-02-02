import { DollarSign, TrendingUp, Building, AlertCircle } from 'lucide-react';

const FinancialInfo = ({ data, onChange }) => {
  const handleChange = (field) => (e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  const handleCheckboxChange = (field) => (e) => {
    onChange({ ...data, [field]: e.target.checked });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-brand-gradient rounded-lg flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Financial Information</h2>
          <p className="text-gray-500 text-sm">Provide your financial details</p>
        </div>
      </div>

      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-brand-purple" />
        Revenue Statistics
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="input-label">Annual Revenue (Last Year) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={data.annualRevenue || ''}
              onChange={handleChange('annualRevenue')}
              className="input-field pl-8"
              placeholder="1,000,000"
              required
            />
          </div>
        </div>

        <div>
          <label className="input-label">Projected Revenue (This Year) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={data.projectedRevenue || ''}
              onChange={handleChange('projectedRevenue')}
              className="input-field pl-8"
              placeholder="1,500,000"
              required
            />
          </div>
        </div>

        <div>
          <label className="input-label">Net Profit Margin (%) *</label>
          <input
            type="number"
            value={data.profitMargin || ''}
            onChange={handleChange('profitMargin')}
            className="input-field"
            placeholder="15"
            min="0"
            max="100"
            required
          />
        </div>

        <div>
          <label className="input-label">Monthly Cash Flow *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={data.monthlyCashFlow || ''}
              onChange={handleChange('monthlyCashFlow')}
              className="input-field pl-8"
              placeholder="100,000"
              required
            />
          </div>
        </div>
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <Building className="w-5 h-5 text-brand-purple" />
        Existing Debt & Banking
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="input-label">Outstanding Credit Lines *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={data.outstandingLoans || ''}
              onChange={handleChange('outstandingLoans')}
              className="input-field pl-8"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="input-label">Primary Bank *</label>
          <input
            type="text"
            value={data.primaryBank || ''}
            onChange={handleChange('primaryBank')}
            className="input-field"
            placeholder="Bank Name"
            required
          />
        </div>

        <div>
          <label className="input-label">Bank Account Number *</label>
          <input
            type="text"
            value={data.bankAccountNo || ''}
            onChange={handleChange('bankAccountNo')}
            className="input-field"
            placeholder="Account Number"
            required
          />
        </div>

        <div>
          <label className="input-label">SWIFT/BIC Code *</label>
          <input
            type="text"
            value={data.swiftCode || ''}
            onChange={handleChange('swiftCode')}
            className="input-field"
            placeholder="XXXXXXXX"
            required
          />
        </div>
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-brand-purple" />
        Default History
      </h3>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasDefaultHistory || false}
            onChange={handleCheckboxChange('hasDefaultHistory')}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
          />
          <div>
            <span className="font-medium text-gray-800">
              Previous Default or Restructuring
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Check this box if your company has any history of loan defaults, restructurings, or bankruptcy proceedings.
            </p>
          </div>
        </label>
      </div>

      {data.hasDefaultHistory && (
        <div className="animate-fade-in">
          <label className="input-label">Please provide details *</label>
          <textarea
            value={data.defaultDetails || ''}
            onChange={handleChange('defaultDetails')}
            className="input-field min-h-[100px]"
            placeholder="Describe the circumstances and resolution..."
            required
          />
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All financial information provided will be verified during the credit assessment process. 
          Please ensure accuracy to avoid delays in your application.
        </p>
      </div>
    </div>
  );
};

export default FinancialInfo;
