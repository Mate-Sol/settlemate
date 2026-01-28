require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const PSPProfile = require('./models/PSPProfile');
const OrderBook = require('./models/OrderBook');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing users...');
    await User.deleteMany({ role: { $in: ['CRO', 'CFO'] } });
    console.log('✅ Cleared CRO and CFO users\n');

    // Hash password for admin users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create CRO User
    console.log('Creating CRO user...');
    const croUser = new User({
      email: 'cro@credmate.com',
      passwordHash: hashedPassword,
      name: 'John Anderson',
      role: 'CRO'
    });
    await croUser.save();
    console.log('✅ CRO User created: cro@credmate.com / admin123\n');

    // Create CFO User
    console.log('Creating CFO user...');
    const cfoUser = new User({
      email: 'cfo@credmate.com',
      passwordHash: hashedPassword,
      name: 'Sarah Martinez',
      role: 'CFO'
    });
    await cfoUser.save();
    console.log('✅ CFO User created: cfo@credmate.com / admin123\n');

    // Create a sample PSP user for testing (optional)
    console.log('Creating sample PSP user...');
    const pspUserPassword = await bcrypt.hash('demo123', salt);
    const pspUser = new User({
      email: 'psp@credmate.com',
      passwordHash: pspUserPassword,
      name: 'Acme Payments Ltd',
      role: 'PSP'
    });
    await pspUser.save();

    // Create PSP Profile for the sample PSP
    const pspProfile = new PSPProfile({
      userId: pspUser._id,
      companyName: 'Acme Payments Ltd',
      registrationNo: 'REG-2024-001',
      country: 'United States',
      yearEstablished: 2018,
      keyContact: {
        name: 'Michael Johnson',
        email: 'michael@acmepayments.com',
        phone: '+1-555-0123'
      },
      uboDetails: 'Michael Johnson - 100% ownership',
      pepExposure: false,
      sector: 'Payment Processing',
      transactionVolume: '$2.5M - $5M monthly',
      keyProducts: ['Payment Gateway', 'Mobile Payments', 'POS Systems'],
      topCustomers: ['TechCorp Inc', 'Global Retail', 'FastShip LLC'],
      topSuppliers: ['Visa', 'Mastercard', 'PayPal'],
      annualRevenue: 12500000,
      outstandingLoans: 500000,
      bankAccount: {
        bankName: 'First National Bank',
        accountNumber: '****5678',
        swiftCode: 'FNBUS33'
      },
      defaultHistory: 'No default history',
      creditLineStatus: 'Approved',
      requestedAmount: 500000,
      requestedDuration: 180,
      approvedAmount: 500000,
      approvedDuration: 180,
      utilizedBips: 5,
      unutilizedBips: 1,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6'
    });
    await pspProfile.save();
    console.log('✅ Sample PSP User created: psp@credmate.com / demo123');
    console.log('   Company: Acme Payments Ltd\n');

    // Create sample Order Book entries for the PSP
    console.log('Creating sample order book entries...');
    const orderBookEntries = [
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-001',
        customerName: 'TechCorp Inc',
        amount: 25000,
        settlementDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'Pending'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-002',
        customerName: 'Global Retail',
        amount: 45000,
        settlementDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-003',
        customerName: 'FastShip LLC',
        amount: 18000,
        settlementDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-004',
        customerName: 'Metro Services',
        amount: 32000,
        settlementDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
        status: 'Financed'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-005',
        customerName: 'DigiPay Corp',
        amount: 55000,
        settlementDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-006',
        customerName: 'CloudBase Inc',
        amount: 28000,
        settlementDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-007',
        customerName: 'NextGen Ltd',
        amount: 42000,
        settlementDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
        status: 'Financed'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-008',
        customerName: 'Swift Trade',
        amount: 15000,
        settlementDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (overdue)
        status: 'Pending'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-009',
        customerName: 'Prime Goods',
        amount: 38000,
        settlementDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'Settled'
      },
      {
        pspId: pspProfile._id,
        referenceId: 'ORD-2026-010',
        customerName: 'DataFlow Inc',
        amount: 22000,
        settlementDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      }
    ];

    await OrderBook.insertMany(orderBookEntries);
    console.log(`✅ Created ${orderBookEntries.length} order book entries\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Login Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('CRO:  cro@credmate.com / admin123');
    console.log('CFO:  cfo@credmate.com / admin123');
    console.log('PSP:  psp@credmate.com / demo123');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run seeder
connectDB().then(() => seedDatabase());
