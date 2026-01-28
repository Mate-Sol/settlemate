import { Building2, User, FileText, AlertTriangle } from 'lucide-react';

const CompanyInfo = ({ data, onChange }) => {
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
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Company Information</h2>
          <p className="text-gray-500 text-sm">Tell us about your organization</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="input-label">Company Name *</label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={handleChange('companyName')}
            className="input-field"
            placeholder="Acme Payments Ltd"
            required
          />
        </div>

        <div>
          <label className="input-label">Registration Number *</label>
          <input
            type="text"
            value={data.registrationNo || ''}
            onChange={handleChange('registrationNo')}
            className="input-field"
            placeholder="12345678"
            required
          />
        </div>

        <div>
          <label className="input-label">Country of Incorporation *</label>
          <select
            value={data.country || ''}
            onChange={handleChange('country')}
            className="input-field"
            required
          >
            <option value="">Select Country</option>
            <option value="UK">United Kingdom</option>
            <option value="US">United States</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="SG">Singapore</option>
            <option value="AE">United Arab Emirates</option>
          </select>
        </div>

        <div>
          <label className="input-label">Year Established *</label>
          <input
            type="number"
            value={data.yearEstablished || ''}
            onChange={handleChange('yearEstablished')}
            className="input-field"
            placeholder="2020"
            min="1900"
            max="2026"
            required
          />
        </div>
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <User className="w-5 h-5 text-brand-purple" />
        Key Contact Person
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="input-label">Full Name *</label>
          <input
            type="text"
            value={data.contactName || ''}
            onChange={handleChange('contactName')}
            className="input-field"
            placeholder="John Smith"
            required
          />
        </div>

        <div>
          <label className="input-label">Position *</label>
          <input
            type="text"
            value={data.contactPosition || ''}
            onChange={handleChange('contactPosition')}
            className="input-field"
            placeholder="CEO"
            required
          />
        </div>

        <div>
          <label className="input-label">Email *</label>
          <input
            type="email"
            value={data.contactEmail || ''}
            onChange={handleChange('contactEmail')}
            className="input-field"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="input-label">Phone *</label>
          <input
            type="tel"
            value={data.contactPhone || ''}
            onChange={handleChange('contactPhone')}
            className="input-field"
            placeholder="+1 234 567 8900"
            required
          />
        </div>
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5 text-brand-purple" />
        Ultimate Beneficial Owner (UBO) Details
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="input-label">UBO Full Name *</label>
          <input
            type="text"
            value={data.uboName || ''}
            onChange={handleChange('uboName')}
            className="input-field"
            placeholder="Full legal name"
            required
          />
        </div>

        <div>
          <label className="input-label">Ownership Percentage *</label>
          <input
            type="number"
            value={data.uboOwnership || ''}
            onChange={handleChange('uboOwnership')}
            className="input-field"
            placeholder="25"
            min="0"
            max="100"
            required
          />
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isPEP || false}
            onChange={handleCheckboxChange('isPEP')}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
          />
          <div>
            <span className="flex items-center gap-2 font-medium text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              Politically Exposed Person (PEP) Declaration
            </span>
            <p className="text-sm text-amber-700 mt-1">
              Check this box if any UBO or key person is or has been a politically exposed person.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default CompanyInfo;
