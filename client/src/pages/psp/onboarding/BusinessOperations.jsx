import { Briefcase, Package, Users, Truck, Plus, X } from 'lucide-react';
import { useState } from 'react';

const BusinessOperations = ({ data, onChange }) => {
  const handleChange = (field) => (e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  const addItem = (field) => {
    const currentItems = data[field] || [''];
    if (currentItems.length < 5) {
      onChange({ ...data, [field]: [...currentItems, ''] });
    }
  };

  const removeItem = (field, index) => {
    const currentItems = data[field] || [];
    if (currentItems.length > 1) {
      onChange({ ...data, [field]: currentItems.filter((_, i) => i !== index) });
    }
  };

  const updateItem = (field, index, value) => {
    const currentItems = data[field] || [];
    const newItems = [...currentItems];
    newItems[index] = value;
    onChange({ ...data, [field]: newItems });
  };

  const sectors = [
    'Payment Processing',
    'E-commerce',
    'Remittance',
    'Digital Banking',
    'Cryptocurrency',
    'Travel & Hospitality',
    'Retail',
    'B2B Payments',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-brand-gradient rounded-lg flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Business Operations</h2>
          <p className="text-gray-500 text-sm">Tell us about your business activities</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="input-label">Primary Business Sector *</label>
          <select
            value={data.sector || ''}
            onChange={handleChange('sector')}
            className="input-field"
            required
          >
            <option value="">Select Sector</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Monthly Transaction Volume *</label>
          <select
            value={data.transactionVolume || ''}
            onChange={handleChange('transactionVolume')}
            className="input-field"
            required
          >
            <option value="">Select Volume</option>
            <option value="<100k">Less than $100,000</option>
            <option value="100k-500k">$100,000 - $500,000</option>
            <option value="500k-1m">$500,000 - $1,000,000</option>
            <option value="1m-5m">$1,000,000 - $5,000,000</option>
            <option value=">5m">More than $5,000,000</option>
          </select>
        </div>
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <Package className="w-5 h-5 text-brand-purple" />
        Key Products/Services
      </h3>
      <p className="text-sm text-gray-500 mb-4">List your main products or services</p>

      <div className="space-y-3">
        {(data.products || ['']).map((product, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={product}
              onChange={(e) => updateItem('products', index, e.target.value)}
              className="input-field flex-1"
              placeholder={`Product/Service ${index + 1}`}
            />
            {(data.products || []).length > 1 && (
              <button
                type="button"
                onClick={() => removeItem('products', index)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {(data.products || []).length < 5 && (
          <button
            type="button"
            onClick={() => addItem('products')}
            className="flex items-center gap-2 text-brand-purple hover:underline text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Product/Service
          </button>
        )}
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <Users className="w-5 h-5 text-brand-purple" />
        Top 5 Customers
      </h3>
      <p className="text-sm text-gray-500 mb-4">List your largest customers by revenue</p>

      <div className="space-y-3">
        {(data.customers || ['']).map((customer, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={customer}
              onChange={(e) => updateItem('customers', index, e.target.value)}
              className="input-field flex-1"
              placeholder={`Customer ${index + 1}`}
            />
            {(data.customers || []).length > 1 && (
              <button
                type="button"
                onClick={() => removeItem('customers', index)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {(data.customers || []).length < 5 && (
          <button
            type="button"
            onClick={() => addItem('customers')}
            className="flex items-center gap-2 text-brand-purple hover:underline text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold flex items-center gap-2">
        <Truck className="w-5 h-5 text-brand-purple" />
        Top 5 Suppliers
      </h3>
      <p className="text-sm text-gray-500 mb-4">List your key suppliers or partners</p>

      <div className="space-y-3">
        {(data.suppliers || ['']).map((supplier, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={supplier}
              onChange={(e) => updateItem('suppliers', index, e.target.value)}
              className="input-field flex-1"
              placeholder={`Supplier ${index + 1}`}
            />
            {(data.suppliers || []).length > 1 && (
              <button
                type="button"
                onClick={() => removeItem('suppliers', index)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {(data.suppliers || []).length < 5 && (
          <button
            type="button"
            onClick={() => addItem('suppliers')}
            className="flex items-center gap-2 text-brand-purple hover:underline text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        )}
      </div>
    </div>
  );
};

export default BusinessOperations;
