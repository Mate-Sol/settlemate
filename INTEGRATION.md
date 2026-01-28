# Frontend-Backend Integration Guide

This guide demonstrates how to integrate React components with the backend API.

## Quick Start

Both servers should be running:
- Frontend: `cd client && npm run dev`
- Backend: `cd server && npm run dev`

Backend will be at `http://localhost:5000`
Frontend will be at the Vite dev server port (check terminal)

## API Client Usage

Import the API client in your components:

```javascript
import { pspAPI, croAPI, cfoAPI } from '../services/api';
```

## Example: Fetching Data with Loading States

### PSP Dashboard - Get Profile

```javascript
import { useState, useEffect } from 'react';
import { pspAPI } from '../../services/api';

function PSPDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await pspAPI.getProfile();
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{profile.companyName}</h1>
      {/* ... rest of component */}
    </div>
  );
}
```

### CRO Dashboard - Get Applications

```javascript
import { useState, useEffect } from 'react';
import { croAPI } from '../../services/api';

function CRODashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsResponse, statsResponse] = await Promise.all([
        croAPI.getApplications('Pending'),
        croAPI.getStats()
      ]);
      setApplications(appsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### CRO - Approve Application with Contract Deployment

```javascript
const handleApprove = async (applicationId) => {
  try {
    setSubmitting(true);
    const response = await croAPI.approveApplication(applicationId, {
      approvedAmount: amount,
      approvedDuration: duration,
      walletAddress: pspWalletAddress,
      notes: approvalNotes
    });

    // Response includes deployed contract address
    console.log('Contract deployed:', response.data.deployment.contractAddress);
    
    // Refresh applications list
    await fetchData();
  } catch (err) {
    setError(err.response?.data?.message || 'Approval failed');
  } finally {
    setSubmitting(false);
  }
};
```

## Current Integration Status

### ✅ Fully Connected
- **Authentication**: Login, Register, Logout with JWT
- **API Client**: Axios with auto JWT headers
- **Error Handling**: Auto-redirect on 401

### 📝 Ready to Connect (Examples Above)
- **PSP Components**: Profile, Apply Limit, Order Book, Pool Status
- **CRO Components**: Applications List, Approve (deploys contract), Reject
- **CFO Components**: Stats, Exposure, Yield History

### Mock Data vs Backend

Most components currently use mock data for rapid prototyping. To connect to backend:

1. Replace mock data arrays with API calls
2. Add useEffect for initial data fetch
3. Add loading and error states
4. Update form submissions to call API endpoints

Example transformation:

```javascript
// BEFORE (Mock Data)
const [orders, setOrders] = useState([
  { id: 1, customer: 'Merchant A', amount: 50000 }
]);

// AFTER (Backend Integration)
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchOrders = async () => {
    try {
      const response = await pspAPI.getOrderBook();
      setOrders(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchOrders();
}, []);
```

## Testing Backend Integration

1. **Register a new PSP user**:
   - POST `/api/auth/register` with company info
   - Receives JWT token
   - Auto-logged in

2. **Apply for financing limit**:
   - POST `/api/psp/apply-limit` with amount and duration
   - Status changes to "Pending"

3. **CRO reviews and approves**:
   - GET `/api/cro/applications` to see pending
   - POST `/api/cro/applications/:id/approve`
   - **Smart contract deploys to Sepolia automatically**
   - PSP gets assigned pool address

4. **PSP requests financing**:
   - POST `/api/psp/request-financing` with amount
   - Links to order book references

5. **View blockchain status**:
   - GET `/api/psp/pool-status`
   - Queries deployed contract on Sepolia
   - Returns real-time pool balance and utilization

## Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`.env`):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ADMIN_PRIVATE_KEY=0x...
USDDF_TOKEN_ADDRESS=0xE2853C79cc6761eFFEAdF15f4199f843aa4B3E37
```

## Notes

- Frontend components are fully functional with mock data for demo purposes
- Backend API is complete and ready for integration
- Smart contract deployment works on Sepolia (tested)
- JWT authentication working end-to-end
- Components can be gradually connected to backend asneeded
- Current setup allows demo without requiring backend connection

This architecture provides flexibility: demo with mocks OR connect to live backend + blockchain.
