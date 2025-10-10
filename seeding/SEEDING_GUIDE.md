# 🌱 Comprehensive Firestore Seeding Guide

**Version:** 1.0.0  

This guide provides complete documentation for seeding your Advanced Shop Firestore database with test data that enables thorough testing of all features including the support ticket system, user roles, orders, products, and more.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firestore Collections Schema](#firestore-collections-schema)
4. [Seed Files Reference](#seed-files-reference)
5. [Seeding Process](#seeding-process)
6. [User Roles & Authentication](#user-roles--authentication)
7. [Testing Scenarios](#testing-scenarios)
8. [Troubleshooting](#troubleshooting)
9. [Data Cleanup](#data-cleanup)

---

## Overview

### What Gets Seeded

This seeding utility populates your Firestore database with:

- ✅ **13 Users** (1 admin, 2 agents, 10 customers) with complete profiles
- ✅ **27 Products** across 7 categories with inventory tracking
- ✅ **30 Orders** in various states (paid, shipped, processing, cancelled)
- ✅ **15 Discount Codes** (site-wide, category-specific, item-specific)
- ✅ **15 Support Tickets** covering all workflows and priorities
- ✅ **29 Ticket Replies** demonstrating threaded conversations
- ✅ **Store Settings** (shipping, tax, payment configuration)
- ✅ **System Configuration** (onboarding completion status)

### Key Features Enabled

- 🎫 **Full Support Ticket System** - Open, in-progress, resolved, and closed tickets
- 👥 **Role-Based Access Control** - Admin, agent, and customer roles
- 🛒 **Complete E-commerce Flow** - Browse → Cart → Checkout → Orders
- 💳 **Payment Methods** - Multiple saved cards per user
- 📍 **Address Management** - Multiple shipping/billing addresses
- 🎯 **Discount System** - Various discount types and scopes
- 📊 **Analytics Ready** - Sufficient data for dashboard metrics

---

## Prerequisites

### Required Software

- **Node.js** 18+ with npm
- **Firebase Project** with Firestore enabled
- **Firebase Admin SDK** credentials

### Firebase Setup Steps

1. **Create Firebase Project**
   ```bash
   # Visit https://console.firebase.google.com/
   # Click "Add Project" and follow setup wizard
   ```

2. **Enable Firestore**
   ```bash
   # In Firebase Console → Build → Firestore Database
   # Click "Create Database"
   # Choose "Start in production mode"
   # Select your preferred region
   ```

3. **Generate Service Account Key**
   ```bash
   # Firebase Console → Project Settings → Service Accounts
   # Click "Generate New Private Key"
   # Save as firebase-admin.json in store-seeder/ directory
   ```

4. **Install Dependencies**
   ```bash
   cd store-seeder
   npm install
   ```

### Security Rules

Before seeding, deploy these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow seeding operations (remove after seeding in production)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Important**: Replace with proper security rules after seeding!

---

## Firestore Collections Schema

### Collection: `users`

**Purpose**: User accounts with roles, addresses, and payment methods

**Schema**:
```typescript
{
  userId: string,              // Unique user ID (also document ID)
  email: string,               // User email
  firstName: string,           // First name
  lastName: string,            // Last name
  name: string,                // Full display name
  phone: string,               // Phone number
  role: "admin" | "agent" | "customer",  // User role
  isInitialAdmin?: boolean,    // Flag for first admin
  marketingOptIn: boolean,     // Email marketing consent
  addresses: Array<{
    id: string,
    label: string,             // "default", "billing", "work", etc.
    line1: string,
    line2?: string,
    city: string,
    region: string,
    postalCode: string,
    country: string,
    isDefault: boolean
  }>,
  paymentMethods: Array<{
    id: string,
    type: "card",
    brand: string,             // "visa", "mastercard", "amex"
    last4: string,
    expiryMonth: string,
    expiryYear: string,
    holderName: string,
    isDefault: boolean,
    createdAt: string
  }>,
  accountCredit?: number,      // Store credit balance
  agentStats?: {               // Only for agents
    ticketsAssigned: number,
    ticketsResolved: number,
    avgResponseTimeMinutes: number,
    customerSatisfaction: number
  },
  createdAt: string,
  lastLogin: string
}
```

**Seed File**: `usersEnhancedSeed.json`  
**Count**: 13 users (1 admin, 2 agents, 10 customers)

---

### Collection: `products`

**Purpose**: Product catalog with pricing and inventory

**Schema**:
```typescript
{
  sku: string,                 // Stock Keeping Unit (also document ID)
  name: string,
  title: string,               // Display title
  category: string,
  priceUSD: number,
  inventory: number,           // Stock quantity (0 = out of stock)
  imageUrl: string,
  shortDescription: string,
  fullDescription: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Seed File**: `productSeed.json`  
**Count**: 27 products across 7 categories  
**Categories**: Mechanical Keyboards, Development Boards, Software Tools, Programming Books, Chairs, Accessories

**Edge Cases Covered**:
- ✅ Out of stock items (inventory = 0)
- ✅ High-demand items (mentioned in tickets)
- ✅ Various price points ($5 - $1,445)
- ✅ Different product types (physical, digital, furniture)

---

### Collection: `orders`

**Purpose**: Customer purchase history and fulfillment tracking

**Schema**:
```typescript
{
  orderId: string,             // Order ID (also document ID)
  userId: string,              // Reference to user
  placedAt: string,            // ISO timestamp
  status: "paid" | "processing" | "shipped" | "cancelled",
  items: Array<{
    sku: string,
    qty: number
  }>,
  shippingUSD: number,
  taxRate: number,
  paymentMethod: "card" | "paypal",
  shippingAddress: {
    line1: string,
    city: string,
    region: string,
    postalCode: string,
    country: string
  }
}
```

**Seed File**: `ordersSeed.json`  
**Count**: 30 orders with various statuses

**Status Distribution**:
- Paid: 16 orders
- Processing: 4 orders
- Shipped: 8 orders
- Cancelled: 2 orders

---

### Collection: `supportTickets`

**Purpose**: Customer support ticket management system

**Schema**:
```typescript
{
  id: string,                  // Ticket ID (also document ID)
  userId: string,              // Customer who created ticket
  userEmail: string,
  userName: string,
  subject: string,
  category: "general" | "order" | "shipping" | "return" | 
            "product" | "account" | "payment" | "technical",
  message: string,
  priority: "low" | "normal" | "high" | "urgent",
  status: "open" | "in_progress" | "resolved" | "closed",
  assignedTo: string | null,  // Agent/admin user ID
  assignedToName: string | null,
  isRead: boolean,
  readBy: string[],            // Array of user IDs who read it
  readAt: string | null,
  resolvedAt?: string,
  closedAt?: string,
  createdAt: string,
  updatedAt: string,
  lastReplyAt: string | null,
  lastReplyBy: string | null
}
```

**Seed File**: `supportTicketsSeed.json`  
**Count**: 15 tickets

**Status Distribution**:
- Open: 4 tickets (unassigned and assigned)
- In Progress: 5 tickets
- Resolved: 5 tickets
- Closed: 1 ticket

**Priority Distribution**:
- Low: 3 tickets
- Normal: 4 tickets
- High: 5 tickets
- Urgent: 3 tickets

**Category Coverage**: All 8 categories represented

---

### Collection: `ticketReplies`

**Purpose**: Threaded conversation history for support tickets

**Schema**:
```typescript
{
  id: string,                  // Reply ID (also document ID)
  ticketId: string,            // Reference to parent ticket
  userId: string,              // User who wrote reply
  userName: string,
  userEmail: string,
  userRole: "admin" | "agent" | "customer",
  message: string,
  attachments: Array<{
    name: string,
    url: string,
    type: string,
    size: number
  }>,
  createdAt: string
}
```

**Seed File**: `ticketRepliesSeed.json`  
**Count**: 29 replies across multiple tickets

**Features Demonstrated**:
- ✅ Multi-turn conversations
- ✅ Agent responses with solutions
- ✅ Customer follow-ups
- ✅ File attachments (2 replies with images)
- ✅ Professional support interactions
- ✅ Ticket resolution workflows

---

### Collection: `discounts`

**Purpose**: Promotional discount codes and campaigns

**Schema**:
```typescript
{
  id: string,                  // Discount ID (also document ID)
  code: string,                // Discount code
  type: "percentage" | "fixed" | "free_shipping",
  value: number,               // Percentage (1-100) or fixed amount
  description: string,
  minPurchaseUSD: number,
  maxDiscountUSD?: number,     // Cap for percentage discounts
  validFrom: string,
  validUntil: string,
  usageLimit: number,
  usageCount: number,
  isActive: boolean,
  stackable: boolean,          // Can combine with other discounts
  scope: "site-wide" | "category" | "item",
  category?: string,           // For category-specific discounts
  productId?: string          // For item-specific discounts
}
```

**Seed File**: `discountsSeed.json`  
**Count**: 15 discount codes

**Types**:
- Percentage: 13 codes (10%-30% off)
- Fixed: 2 codes ($5-$10 off)
- Free Shipping: 1 code

**Scopes**:
- Site-wide: 8 codes
- Category-specific: 6 codes (one per category)
- Item-specific: 1 code

---

### Collection: `settings` (Document: `default`)

**Purpose**: Global store configuration

**Schema**:
```typescript
{
  store: {
    name: string,
    email: string,
    logo: string,
    supportPhone: string,
    supportHours: {
      [day: string]: {
        isOpen: boolean,
        open: string,        // "HH:MM" format
        close: string
      }
    }
  },
  payments: {
    enableCards: boolean,
    cod: boolean,              // Cash on delivery
    pk: string,                // Payment processor public key
    connected: boolean,
    acceptedMethods: string[]
  },
  shipping: {
    base: number,              // Base shipping cost
    freeAt: number             // Free shipping threshold
  },
  taxes: {
    rate: number,              // Tax rate percentage
    origin: string             // Tax origin state
  },
  createdAt: string,
  updatedAt: string,
  updatedBy: string
}
```

**Seed File**: `settingsSeed.json`

---

### Collection: `system` (Document: `setup`)

**Purpose**: System-level configuration and onboarding status

**Schema**:
```typescript
{
  completed: boolean,
  completedAt: string,
  version: string,
  initialSetupBy: string,
  features: {
    supportTickets: boolean,
    analytics: boolean,
    discounts: boolean,
    multiplePaymentMethods: boolean,
    addressManagement: boolean
  },
  lastMaintenance: string
}
```

**Seed File**: `systemSeed.json`

---

## Seed Files Reference

### Available Seed Files

| File | Collection | Documents | Purpose |
|------|-----------|-----------|---------|
| `usersEnhancedSeed.json` | users | 13 | Users with complete profiles, roles, addresses, payment methods |
| `productSeed.json` | products | 27 | Product catalog with inventory |
| `ordersSeed.json` | orders | 30 | Order history across all statuses |
| `discountsSeed.json` | discounts | 15 | Promotional codes and campaigns |
| `supportTicketsSeed.json` | supportTickets | 15 | Support tickets in various states |
| `ticketRepliesSeed.json` | ticketReplies | 29 | Threaded ticket conversations |
| `settingsSeed.json` | settings | 1 | Store configuration |
| `systemSeed.json` | system | 1 | System setup status |

### Legacy Files (Optional)

| File | Status | Notes |
|------|--------|-------|
| `usersSeed.json` | Legacy | Basic user data without roles/payment methods |

---

## Seeding Process

### Step 1: Prepare Environment

```bash
cd store-seeder
npm install

# Copy service account credentials
cp path/to/downloaded-key.json firebase-admin.json

# Verify files exist
ls -la *.json
```

### Step 2: Create Master Seeding Script

Create `seed-all.mjs` in the `store-seeder` directory:

```javascript
import admin from "firebase-admin";
import { readFile } from "fs/promises";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  await readFile(new URL("./firebase-admin.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("🚀 Starting comprehensive database seeding...\n");

// Helper function to seed a collection
async function seedCollection(collectionName, dataFile, options = {}) {
  const { useIdAsDocId = false, docId = null, isSubcollection = false } = options;
  
  console.log(`📦 Seeding ${collectionName}...`);
  
  const data = JSON.parse(
    await readFile(new URL(`./${dataFile}`, import.meta.url))
  );
  
  if (docId) {
    // Single document (for settings, system)
    await db.collection(collectionName).doc(docId).set(data);
    console.log(`✅ ${collectionName}/${docId} created\n`);
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  for (const item of data) {
    const id = useIdAsDocId ? item.id || item.userId || item.sku || item.orderId : null;
    const ref = id 
      ? db.collection(collectionName).doc(id)
      : db.collection(collectionName).doc();
    
    // Convert date strings to Firestore Timestamps where needed
    const processedItem = { ...item };
    if (collectionName === 'products') {
      processedItem.createdAt = admin.firestore.FieldValue.serverTimestamp();
      processedItem.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    batch.set(ref, processedItem, { merge: true });
    count++;
    
    // Commit every 500 docs
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  ↳ Committed ${count} documents...`);
    }
  }
  
  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ ${collectionName}: ${count} documents created\n`);
}

// Seed in correct order
async function seedAll() {
  try {
    // 1. System configuration (must be first for onboarding check)
    await seedCollection("system", "systemSeed.json", { docId: "setup" });
    
    // 2. Store settings
    await seedCollection("settings", "settingsSeed.json", { docId: "default" });
    
    // 3. Users (needed for tickets, orders)
    await seedCollection("users", "usersEnhancedSeed.json", { useIdAsDocId: true });
    
    // 4. Products (needed for orders)
    await seedCollection("products", "productSeed.json", { useIdAsDocId: true });
    
    // 5. Orders (references users and products)
    await seedCollection("orders", "ordersSeed.json", { useIdAsDocId: true });
    
    // 6. Discounts
    await seedCollection("discounts", "discountsSeed.json", { useIdAsDocId: true });
    
    // 7. Support tickets (references users)
    await seedCollection("supportTickets", "supportTicketsSeed.json", { useIdAsDocId: true });
    
    // 8. Ticket replies (references tickets and users)
    await seedCollection("ticketReplies", "ticketRepliesSeed.json", { useIdAsDocId: true });
    
    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("  • 1 System configuration");
    console.log("  • 1 Store settings");
    console.log("  • 13 Users (1 admin, 2 agents, 10 customers)");
    console.log("  • 27 Products");
    console.log("  • 30 Orders");
    console.log("  • 15 Discounts");
    console.log("  • 15 Support tickets");
    console.log("  • 29 Ticket replies");
    console.log("\n✨ Your database is ready for testing!");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedAll().then(() => process.exit(0));
```

### Step 3: Run Seeding Script

```bash
node seed-all.mjs
```

**Expected Output**:
```
🚀 Starting comprehensive database seeding...

📦 Seeding system...
✅ system/setup created

📦 Seeding settings...
✅ settings/default created

📦 Seeding users...
✅ users: 13 documents created

📦 Seeding products...
✅ products: 27 documents created

📦 Seeding orders...
✅ orders: 30 documents created

📦 Seeding discounts...
✅ discounts: 15 documents created

📦 Seeding supportTickets...
✅ supportTickets: 15 documents created

📦 Seeding ticketReplies...
✅ ticketReplies: 29 documents created

🎉 Database seeding completed successfully!
```

### Step 4: Verify in Firebase Console

1. Go to Firebase Console → Firestore Database
2. Verify collections exist:
   - ✅ system (1 doc)
   - ✅ settings (1 doc)
   - ✅ users (13 docs)
   - ✅ products (27 docs)
   - ✅ orders (30 docs)
   - ✅ discounts (15 docs)
   - ✅ supportTickets (15 docs)
   - ✅ ticketReplies (29 docs)

---

## User Roles & Authentication

### Test Accounts

**⚠️ IMPORTANT**: You must create Firebase Authentication accounts for these users before they can log in!

#### Admin Account
```
Email: admin@advancedshop.com
Password: (set via Firebase Auth Console)
Role: admin
User ID: ADMIN-001
```

#### Agent Accounts
```
Agent 1:
Email: sarah.johnson@advancedshop.com
Password: (set via Firebase Auth Console)
Role: agent
User ID: AGENT-001

Agent 2:
Email: michael.chen@advancedshop.com
Password: (set via Firebase Auth Console)
Role: agent
User ID: AGENT-002
```

#### Customer Accounts
```
Test Customer:
Email: gm@eimutah.com
Password: (set via Firebase Auth Console)
Role: customer
User ID: lhoijzfg2ya5Z7LzY2RBiWBI3sa2

(+ 9 more customer accounts - see usersEnhancedSeed.json)
```

### Creating Auth Accounts

**Option 1: Firebase Console (Manual)**
1. Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. **CRITICAL**: Set User UID to match the userId from seed data

**Option 2: Script (Automated)**

Create `create-auth-users.mjs`:

```javascript
import admin from "firebase-admin";
import { readFile } from "fs/promises";

const serviceAccount = JSON.parse(
  await readFile(new URL("./firebase-admin.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const users = JSON.parse(
  await readFile(new URL("./usersEnhancedSeed.json", import.meta.url))
);

async function createAuthUsers() {
  for (const user of users) {
    try {
      await admin.auth().createUser({
        uid: user.userId,
        email: user.email,
        password: "TestPass123!",  // Change this!
        displayName: user.name
      });
      console.log(`✅ Created auth user: ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        console.log(`⚠️  User already exists: ${user.email}`);
      } else {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
      }
    }
  }
}

createAuthUsers();
```

Run: `node create-auth-users.mjs`

---

## Testing Scenarios

### 1. Customer Journey Testing

**Scenario**: Complete purchase flow
```
1. Login as customer (gm@eimutah.com)
2. Browse products → Add to cart
3. Apply discount code (SAVE20)
4. Proceed to checkout
5. Select saved address
6. Select saved payment method
7. Place order
8. View order in Orders page
```

**Data Available**:
- 10 customer accounts with saved addresses/payment methods
- 27 products across multiple categories
- 15 active discount codes
- Multiple order examples

### 2. Support Ticket System Testing

**Scenario A: Customer creates ticket**
```
1. Login as customer
2. Navigate to Profile → Support
3. Create new ticket
4. View ticket in list
5. Add reply to existing ticket
```

**Scenario B: Agent handles tickets**
```
1. Login as agent (sarah.johnson@advancedshop.com)
2. View assigned tickets
3. Change ticket status
4. Add reply with solution
5. Mark ticket as resolved
```

**Scenario C**: Admin oversight**
```
1. Login as admin
2. View all tickets
3. Reassign tickets
4. View agent performance stats
5. Handle escalated tickets
```

**Data Available**:
- 15 tickets in various states
- 29 conversation replies
- All priority levels represented
- All categories covered
- Examples with attachments

### 3. Admin Dashboard Testing

**Scenario**: Analytics and management
```
1. Login as admin
2. View dashboard KPIs
3. Filter orders by date/status
4. Analyze product performance
5. View support ticket metrics
6. Manage discounts
7. Update store settings
```

**Data Available**:
- 30 orders for revenue analysis
- Multiple order statuses for funnel
- Ticket data for support metrics
- Product inventory levels
- Discount usage tracking

### 4. Role-Based Access Testing

**Test Cases**:
```
✅ Admin can access all pages
✅ Agent can access support and limited admin pages
✅ Customer can only access customer pages
✅ Unauthenticated users redirected to login
✅ Role-based UI elements show/hide correctly
```

### 5. Edge Case Testing

**Out of Stock Products**:
- Corsair K70 RGB Pro (inventory: 0)
- Arduino Mega 2560 Rev3 (inventory: 0)
- Blue Yeti USB Microphone (inventory: 0)
- Steelcase Leap V2 Chair (inventory: 0)

**Cancelled Orders**:
- ORD-2025-1009 (refund scenario)

**Urgent Tickets**:
- TICKET-003 (discount code issue)
- TICKET-006 (wrong item shipped)

**Unassigned Tickets**:
- TICKET-007 (bulk order inquiry)
- TICKET-012 (gift wrapping question)

---

## Troubleshooting

### Issue: "Permission Denied" Errors

**Solution**:
```javascript
// Temporarily use permissive rules during seeding
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Deploy: `firebase deploy --only firestore:rules`

### Issue: Users Can't Log In

**Solution**: Ensure Firebase Auth accounts are created with matching UIDs

```bash
node create-auth-users.mjs
```

### Issue: Timestamps Not Working

**Solution**: Use `admin.firestore.FieldValue.serverTimestamp()` in seeding script

### Issue: Incomplete Data

**Verify**:
```bash
# Check all collections exist
firebase firestore:indexes

# Count documents
# In Firebase Console → Firestore → Each collection
```

### Issue: Seed Script Fails Midway

**Solution**: The script uses batch writes with merge, so it's safe to re-run:
```bash
node seed-all.mjs  # Re-run safely
```

---

## Data Cleanup

### Reset Database (Development Only)

**⚠️ WARNING**: This deletes ALL data!

Create `flush-database.mjs`:

```javascript
import admin from "firebase-admin";
import { readFile } from "fs/promises";

const serviceAccount = JSON.parse(
  await readFile(new URL("./firebase-admin.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionName) {
  const query = db.collection(collectionName);
  const snapshot = await query.get();
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`✅ Deleted ${snapshot.size} documents from ${collectionName}`);
}

async function flushAll() {
  console.log("🗑️  Flushing database...\n");
  
  const collections = [
    "ticketReplies",
    "supportTickets",
    "discounts",
    "orders",
    "products",
    "users",
    "settings",
    "system"
  ];
  
  for (const collection of collections) {
    await deleteCollection(collection);
  }
  
  console.log("\n✨ Database flushed successfully!");
}

flushAll().then(() => process.exit(0));
```

Run: `node flush-database.mjs`

### Selective Cleanup

To remove only test data:

```javascript
// Delete only users with "Test" in name
const usersRef = db.collection('users');
const snapshot = await usersRef.where('name', '>=', 'Test').get();
snapshot.forEach(doc => doc.ref.delete());
```

---

## Appendix: Complete Schema Reference

### Firestore Structure

```
firestore/
├── system/
│   └── setup                    (1 doc - onboarding status)
├── settings/
│   └── default                  (1 doc - store config)
├── users/                       (13 docs)
│   ├── ADMIN-001
│   ├── AGENT-001
│   ├── AGENT-002
│   ├── lhoijzfg2ya5Z7LzY2RBiWBI3sa2
│   └── USR-000[2-10]
├── products/                    (27 docs)
│   ├── KB-KCR-K2V3
│   ├── DEV-RPI-5-4GB
│   └── ...
├── orders/                      (30 docs)
│   ├── ORD-2025-1001
│   └── ...
├── discounts/                   (15 docs)
│   ├── WELCOME10
│   ├── SAVE20
│   └── ...
├── supportTickets/              (15 docs)
│   ├── TICKET-001
│   └── ...
└── ticketReplies/               (29 docs)
    ├── REPLY-001
    └── ...
```

### Data Relationships

```
users (userId)
  ↓
  ├── orders (userId) → products (sku)
  ├── supportTickets (userId)
  │     ↓
  │     └── ticketReplies (ticketId, userId)
  └── addresses, paymentMethods (embedded)

discounts (code)
  ↓
  └── orders (discount applied)

settings (singleton)
  └── global store configuration

system (singleton)
  └── onboarding and feature flags
```

---

## Support & Contribution

### Getting Help

- 📚 [Main README](../README.md)
- 🐛 [Report Issues](https://github.com/growthwithcoding/advanced-shop-capstone/issues)
- 💬 [Discussions](https://github.com/growthwithcoding/advanced-shop-capstone/discussions)

### Contributing Seed Data

To add new seed scenarios:

1. Create new JSON file following existing schema
2. Update `seed-all.mjs` to include new collection
3. Document new scenarios in this guide
4. Submit PR with test cases

---

**Last Updated**: January 10, 2025  
**Maintainer**: Austin Carlson (@growthwithcoding)  
**Version**: 1.0.0
