const ExternalPSPUser = require('../models/ExternalPSPUser');
const ExternalOrderBook = require('../models/ExternalOrderBook');

/**
 * Orderbook Generator - Automatically creates realistic orderbook entries
 * Generates random but realistic-looking orders every 15 seconds
 */

// Realistic customer names
const firstNames = [
  'John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Jennifer',
  'Robert', 'Lisa', 'William', 'Patricia', 'Richard', 'Mary', 'Joseph', 'Linda',
  'Thomas', 'Barbara', 'Christopher', 'Elizabeth', 'Daniel', 'Susan', 'Matthew', 'Karen',
  'Anthony', 'Nancy', 'Mark', 'Betty', 'Donald', 'Margaret', 'Steven', 'Sandra',
  'Paul', 'Ashley', 'Andrew', 'Kimberly', 'Joshua', 'Donna', 'Kenneth', 'Emily'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

// Realistic company/service types for invoice details
const serviceTypes = [
  'Professional Services Consulting',
  'Software Development Services',
  'Marketing Campaign Management',
  'IT Infrastructure Setup',
  'Cloud Computing Services',
  'Digital Marketing Services',
  'Business Consulting Package',
  'Web Development Project',
  'Mobile App Development',
  'SEO Optimization Services',
  'Content Creation Services',
  'Graphic Design Package',
  'Video Production Services',
  'E-commerce Platform Setup',
  'Data Analytics Services',
  'Legal Consulting Services',
  'Accounting Services',
  'HR Consulting Package',
  'Training and Development',
  'Project Management Services'
];

/**
 * Generate a random number within a range
 */
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random amount with realistic distribution
 * Favors amounts around certain "round" numbers
 */
function generateRealisticAmount() {
  // 70% chance of "round" amounts (multiples of 5000)
  // if (Math.random() < 0.7) {
  //   const roundBase = randomInRange(4, 20); // 20,000 to 100,000 in 5000 increments
  //   return roundBase * 5000;
  // }

  // 30% chance of more "random" amounts
  const baseAmount = randomInRange(5000, 10000);

  // Make it look more realistic by rounding to nearest 100
  return Math.round(baseAmount / 100) * 100;
}

/**
 * Generate realistic customer name
 */
function generateCustomerName() {
  const firstName = firstNames[randomInRange(0, firstNames.length - 1)];
  const lastName = lastNames[randomInRange(0, lastNames.length - 1)];
  return `${firstName} ${lastName}`;
}

/**
 * Generate realistic email from name
 */
function generateEmail(name) {
  const [first, last] = name.toLowerCase().split(' ');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com', 'business.com'];
  const domain = domains[randomInRange(0, domains.length - 1)];

  // Various formats for more realism
  const formats = [
    `${first}.${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first[0]}${last}@${domain}`,
    `${first}_${last}@${domain}`
  ];

  return formats[randomInRange(0, formats.length - 1)];
}

/**
 * Generate realistic phone number
 */
function generatePhone() {
  const areaCode = randomInRange(200, 999);
  const prefix = randomInRange(200, 999);
  const lineNumber = randomInRange(1000, 9999);
  return `+1 (${areaCode}) ${prefix}-${lineNumber}`;
}

/**
 * Generate order reference
 */
function generateOrderReference() {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomInRange(1000, 9999);
  return `ORD-${timestamp}-${random}`;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = randomInRange(1000, 9999);
  return `INV-${year}${month}-${random}`;
}

/**
 * Generate settlement date (between 7 and 45 days from now)
 */
function generateSettlementDate() {
  const daysAhead = randomInRange(7, 45);
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

/**
 * Generate a single realistic order
 */
async function generateSingleOrder(userId) {
  try {
    const customerName = generateCustomerName();
    const amount = generateRealisticAmount();
    const serviceType = serviceTypes[randomInRange(0, serviceTypes.length - 1)];

    const orderData = {
      externalPspUserId: userId,
      orderReference: generateOrderReference(),
      customerName: customerName,
      customerEmail: generateEmail(customerName),
      customerPhone: generatePhone(),
      amount: amount,
      currency: 'USD',
      settlementDate: generateSettlementDate(),
      invoiceNumber: generateInvoiceNumber(),
      invoiceDetails: `${serviceType} - Contract Amount: $${amount.toLocaleString()}`,
      notes: `Auto-generated order on ${new Date().toLocaleString()}`,
      status: 'Pending'
    };

    const order = new ExternalOrderBook(orderData);
    await order.save();

    console.log(`[Orderbook Generator] Created order ${order.orderReference} for $${amount.toLocaleString()}`);

    return order;
  } catch (error) {
    console.error('[Orderbook Generator] Error creating order:', error.message);
    throw error;
  }
}

/**
 * Generate orderbook entry
 * This function will be called by the scheduler
 * Creates orders for the specific External PSP user: psp@credmate.com (Acme)
 */
async function generateOrderbookEntry() {
  try {
    console.log('[Orderbook Generator] Generating new orderbook entry...');

    // Target specific user: psp@credmate.com (Acme)
    const user = await ExternalPSPUser.findOne({ email: '11feb@maildrop.cc' });

    if (!user) {
      console.log(`[Orderbook Generator] Target user not found (ID: ${targetUserId})`);
      console.log('[Orderbook Generator] Looking for user by email: psp@credmate.com');

      // Fallback: try to find by email
      const userByEmail = await ExternalPSPUser.findOne({ email: '11feb@maildrop.cc' });

      if (!userByEmail) {
        console.log('[Orderbook Generator] User psp@credmate.com not found in database');
        return { success: false, message: 'Target user not found' };
      }

      console.log(`[Orderbook Generator] Found user by email: ${userByEmail.companyName}`);
      const order = await generateSingleOrder(userByEmail._id);

      return {
        success: true,
        order: {
          id: order._id,
          reference: order.orderReference,
          customer: order.customerName,
          amount: order.amount
        }
      };
    }

    console.log(`[Orderbook Generator] Creating order for: ${user.companyName} (${user.email})`);
    const order = await generateSingleOrder(user._id);

    return {
      success: true,
      order: {
        id: order._id,
        reference: order.orderReference,
        customer: order.customerName,
        amount: order.amount
      }
    };
  } catch (error) {
    console.error('[Orderbook Generator] Error in generateOrderbookEntry:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start the scheduler interval
 */
let schedulerInterval = null;

function startOrderbookScheduler() {
  if (schedulerInterval) {
    console.log('[Orderbook Generator] Scheduler already running');
    return;
  }

  console.log('[Orderbook Generator] Starting orderbook scheduler (15 second interval)');

  // Run immediately on start
  generateOrderbookEntry();

  // Then run every 15 seconds
  schedulerInterval = setInterval(() => {
    generateOrderbookEntry();
  }, 15000); // 15 seconds = 15000 milliseconds

  console.log('[Orderbook Generator] Scheduler started successfully');
}

/**
 * Stop the scheduler
 */
function stopOrderbookScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Orderbook Generator] Scheduler stopped');
  }
}

module.exports = {
  generateOrderbookEntry,
  generateSingleOrder,
  startOrderbookScheduler,
  stopOrderbookScheduler
};
