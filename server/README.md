# CredMate PSP Backend API

Express.js backend API for the CredMate PSP Credit Line platform with MongoDB and Smart Contract integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure `.env` with:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
   - `ADMIN_PRIVATE_KEY`: Admin wallet private key
   - `USDDF_TOKEN_ADDRESS`: Deployed USD-DF token address

## Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:5000` (or PORT from `.env`)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new PSP user
- `POST /login` - Login user (returns JWT token)
- `GET /me` - Get current authenticated user

### PSP Routes (`/api/psp`) - Requires PSP role
- `GET /profile` - Get PSP profile
- `PUT /profile` - Update PSP profile
- `POST /apply-limit` - Apply for financing limit
- `GET /order-book` - Get order book entries
- `POST /request-financing` - Request drawdown
- `GET /pool-status` - Get blockchain pool status

### CRO Routes (`/api/cro`) - Requires CRO role
- `GET /applications` - Get all applications (filter by status)
- `GET /applications/:id` - Get specific application
- `POST /applications/:id/approve` - Approve and deploy contract
- `POST /applications/:id/reject` - Reject application
- `POST /applications/:id/request-info` - Request more info
- `GET /stats` - Get dashboard statistics

### CFO Routes (`/api/cfo`) - Requires CFO role
- `GET /stats` - Get financial statistics
- `GET /exposure` - Get exposure distribution
- `GET /yield-history` - Get monthly yield history

## Database Schemas

### User
- email, passwordHash, name, role (PSP/CRO/CFO)

### PSPProfile
- Company info, business operations, financial data
- KYC documents
- Credit line status (None, Pending, UnderReview, Approved, Rejected)
- Blockchain integration (walletAddress, assignedPoolAddress)

### FinancingRequest
- Drawdown requests with order book references
- Status tracking (Pending → Validated → Approved → Disbursed → Settled)
- Blockchain transaction hashes

### OrderBook
- PSP settlement orders
- Reference IDs for financing validation

## Smart Contract Integration

The `contractService.js` handles:
- **Deploy CreditLinePool**: Deploys new pool when CRO approves
- **Fund Pool**: Deposits USD-DF liquidity
- **Get Pool Status**: Queries blockchain for pool info
- **Monitor Events**: Listens to Drawdown and Repayment events

## Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

Role-based access control enforces PSP/CRO/CFO permissions.

## Workflow Example

1. **PSP Registration**: POST `/api/auth/register`
2. **PSP Login**: POST `/api/auth/login` → Get JWT token
3. **Apply for Limit**: POST `/api/psp/apply-limit`
4. **CRO Review**: GET `/api/cro/applications`
5. **CRO Approve**: POST `/api/cro/applications/:id/approve` → Deploys contract
6. **PSP Drawdown**: POST `/api/psp/request-financing`
7. **View Pool**: GET `/api/psp/pool-status`

## Environment Variables

See `.env.example` for all required configuration.

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **ethers**: Blockchain interaction
- **cors**: Cross-origin requests
- **dotenv**: Environment configuration
