# 🌱 Firebase Store Seeding Utility

[![Firebase_Admin](https://img.shields.io/badge/Firebase_Admin-13.5.0-orange)](https://www.npmjs.com/package/firebase-admin)
[![Node](https://img.shields.io/badge/Node-ES_Modules-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-ISC-blue)]()

This directory contains the **Firebase Store Seeding Utility** for populating your Firestore database with initial data including products, users, orders, discounts, support tickets, and ticket replies. The script uses the **Firebase Admin SDK** to batch-write data from JSON files directly to your Firebase project.

---

## 📌 What this utility does

### Database Population
- **Batch writes** data from JSON seed files to Firestore collections:
  - Products (`productSeed.json` → `products`)
  - Users (`usersSeed.json` → `users`)
  - Orders (`ordersSeed.json` → `orders`)
  - Discounts (`discountsSeed.json` → `discounts`)
  - Support Tickets (`supportTicketsSeed.json` → `supportTickets`)
  - Ticket Replies (`ticketRepliesSeed.json` → `ticketReplies`)
- Uses appropriate **document IDs** for predictable references and updates.
- Includes automatic **server timestamps** (`createdAt`, `updatedAt`) for all documents.
- Processes up to **400 documents per batch** for optimal performance.

### Data Structure
Each product document includes:
- **name** — Product title/name
- **category** — Product category (e.g., "Mechanical Keyboards", "Programming Books")
- **priceUSD** — Price in USD (stored as number)
- **sku** — Stock Keeping Unit (unique identifier, used as document ID)
- **imageUrl** — Product image URL (Unsplash or other CDN)
- **shortDescription** — Brief product summary
- **fullDescription** — Detailed product information
- **createdAt** — Server timestamp (auto-generated)
- **updatedAt** — Server timestamp (auto-generated)

### Safe Operations
- **Merge mode** (`{ merge: true }`) prevents accidental overwrites of existing products.
- Validates SKU presence before attempting writes.
- Batch commits ensure atomic operations per chunk.

---

## 🧰 Requirements

- **Node.js** (ES Modules support)
- **Firebase project** with Firestore enabled
- **Service account key** JSON file from Firebase Console

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd seding
npm install
```

This installs `firebase-admin` ^13.5.0.

### 2. Configure Firebase Service Account

**Step-by-step guide to get your credentials:**

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)

2. **Enable Firestore Database**
   - In the left sidebar, click **Firestore Database**
   - Click **Create Database**
   - Choose **Start in production mode** or **Test mode** (test mode for development)
   - Select a Cloud Firestore location

3. **Generate Service Account Key**
   - Click the ⚙️ (Settings) icon → **Project Settings**
   - Navigate to the **Service Accounts** tab
   - Click **Generate New Private Key**
   - Confirm by clicking **Generate Key**
   - A JSON file will be downloaded automatically

4. **Set Up Your Credentials File**
   - Rename the downloaded file to `firebase-admin.json`
   - Move it to the `seeding/` directory
   - Or copy the sample file and fill in your values:
   ```bash
   # In the seeding directory
   cp firebase-admin.sample.json firebase-admin.json
   ```
   - Open `firebase-admin.json` and replace the placeholder values with your actual credentials from the downloaded file

**Sample structure** (see `firebase-admin.sample.json` for template):
```json
{
  "type": "service_account",
  "project_id": "your-actual-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  ...
}
```

**⚠️ CRITICAL SECURITY NOTES:**
- ✅ `firebase-admin.json` is already in `.gitignore` (won't be committed)
- ✅ A sample template `firebase-admin.sample.json` is provided (safe to commit)
- ❌ **NEVER** commit your actual `firebase-admin.json` with real credentials
- ❌ **NEVER** share your service account key publicly
- 🔒 Keep this file secure and never expose it in screenshots or logs

### 3. Update File Paths (if needed)

Open `seed-products.mjs` and verify the paths match your system:

```javascript
// Service account path
const svcPath = "K:\\advanced-shop-FB-Edition\\seeding\\firebase-admin.json";

// Product data path
const jsonPath = "K:\\advanced-shop-FB-Edition\\seeding\\productSeed.json";
```

**Tip:** Use absolute paths or adjust relative paths based on where you run the script.

### 4. Run the Seeding Script

**Seed everything (default):**
```bash
node seed-store.mjs
```

**Seed specific collections using flags:**
```bash
# Seed only users
node seed-store.mjs --users

# Seed only products
node seed-store.mjs --products

# Seed only orders
node seed-store.mjs --orders

# Seed only discounts
node seed-store.mjs --discounts

# Seed only support tickets
node seed-store.mjs --tickets

# Seed only ticket replies
node seed-store.mjs --replies

# Combine multiple flags
node seed-store.mjs --products --users --tickets --replies
```

You should see output like:

```
Project ID: your-project-id
Users: committed 10 docs...
Users: seeded 10 docs to 'users'.
Addresses: seeded 20 docs to 'addresses'.
Products: committed 23 docs...
Products: seeded 23 docs to 'products'.
Discounts: committed 5 docs...
Discounts: seeded 5 docs to 'discounts'.
Orders: committed 15 docs...
Orders: seeded 15 docs to 'orders'.
Support Tickets: committed 15 docs...
Support Tickets: seeded 15 docs to 'supportTickets'.
Ticket Replies: committed 29 docs...
Ticket Replies: seeded 29 docs to 'ticketReplies'.
Done.
```

---

## 📂 Directory Structure

```
seeding/
├─ firebase-admin.json          # Service account credentials (DO NOT COMMIT)
├─ firebase-admin.sample.json   # Template for credentials (SAFE to commit)
├─ package.json                 # Dependencies (firebase-admin)
├─ package-lock.json            # Lock file
├─ productSeed.json             # Product data (23 items)
├─ usersSeed.json               # User data
├─ ordersSeed.json              # Order data
├─ discountsSeed.json           # Discount codes
├─ supportTicketsSeed.json      # Support tickets (15 tickets)
├─ ticketRepliesSeed.json       # Ticket replies (29 replies)
├─ seed-store.mjs               # Main seeding script
├─ flush-firestore.mjs          # Script to clear Firestore collections
├─ README.md                    # This file
├─ SEEDING_GUIDE.md             # Detailed seeding guide
└─ SEED_DATA_SUMMARY.md         # Summary of all seed data
```

---

## 🗂️ Sample Data Included

### Products (`productSeed.json`)
**23 products** across these categories:
- Mechanical Keyboards, Programming Books, Development Boards
- Software Tools, Monitors, Accessories, Chairs

### Users (`usersSeed.json`)
Sample user accounts with various roles (customer, agent, admin)

### Orders (`ordersSeed.json`)
Sample orders with line items, pricing, and shipping information

### Discounts (`discountsSeed.json`)
Promotional discount codes with various types and conditions

### Support Tickets (`supportTicketsSeed.json`)
**15 support tickets** covering various scenarios:
- **Categories**: Shipping, Return, Payment, Account, Product, Order, Technical, General
- **Statuses**: Open, In Progress, Resolved, Closed
- **Priorities**: Low, Normal, High, Urgent
- **Examples**:
  - Order tracking inquiries
  - Return policy questions
  - Payment/discount code issues
  - Account access problems
  - Product recommendations
  - Wrong/damaged items
  - Bulk order inquiries
  - Technical issues
  - Refund status
  - International shipping

### Ticket Replies (`ticketRepliesSeed.json`)
**29 ticket replies** showing conversations between customers and support agents/admins:
- Agent responses with solutions and tracking information
- Customer follow-up messages
- Admin interventions for technical issues
- Multi-turn conversations demonstrating ticket lifecycle
- Various user roles: customer, agent, admin

---

## 🔧 How It Works

### Batch Writing Process

```javascript
async function writeInBatches(docs) {
  const chunkSize = 500;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = db.batch();
    const slice = docs.slice(i, i + chunkSize);
    for (const p of slice) {
      // Validate and prepare data
      const priceUSD = typeof p.priceUSD === "string" 
        ? Number(p.priceUSD) 
        : p.priceUSD;
      
      if (!p.sku) throw new Error("Missing SKU");
      
      // Write to Firestore using SKU as document ID
      const ref = db.collection("products").doc(p.sku);
      batch.set(ref, {
        name: p.name,
        category: p.category,
        priceUSD,
        sku: p.sku,
        imageUrl: p.imageUrl,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    console.log(`Committed ${slice.length} docs...`);
  }
}
```

### Key Features:
1. **Chunks processing** — Handles large datasets by processing 500 items at a time
2. **Type conversion** — Ensures priceUSD is stored as number, not string
3. **SKU validation** — Throws error if SKU is missing
4. **Merge mode** — Preserves existing fields if product already exists
5. **Server timestamps** — Uses Firebase server time for consistency

---

## 📝 Customizing Product Data

### Adding New Products

Edit `productSeed.json` and add new product objects:

```json
{
  "name": "Your Product Name",
  "category": "Your Category",
  "priceUSD": 99.99,
  "sku": "YOUR-SKU-123",
  "imageUrl": "https://images.unsplash.com/photo-...",
  "shortDescription": "Brief description here",
  "fullDescription": "Detailed description with features and specs."
}
```

**Required fields:**
- `name` (string)
- `category` (string)
- `priceUSD` (number or string, will be converted)
- `sku` (string, must be unique)
- `imageUrl` (string, valid URL)
- `shortDescription` (string)
- `fullDescription` (string)

### Re-seeding the Database

To update existing data or add new items:

```bash
# Re-seed everything
node seed-store.mjs

# Re-seed specific collections
node seed-store.mjs --products --tickets --replies
```

Documents with matching IDs will have their data updated (merge mode).

### Clearing the Database

To remove all data before re-seeding:

```bash
# Clear all collections
node flush-firestore.mjs

# Then re-seed
node seed-store.mjs
```

---

## 🔒 Security Best Practices

1. **Never commit** `firebase-admin.json` to Git
2. **Restrict permissions** on service account (Firestore only)
3. **Use environment variables** for production deployments
4. **Rotate keys regularly** if compromised
5. **Review Firestore rules** to prevent unauthorized writes

---

## 🐛 Troubleshooting

### Error: "Project ID not set"
**Solution:** Ensure your service account JSON includes `project_id` field, or explicitly set it:
```javascript
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "your-project-id"
});
```

### Error: "Cannot find module"
**Solution:** Run `npm install` in the seeding directory first.

### Error: "Permission denied"
**Solution:** Check Firebase Console → IAM & Admin. Service account needs "Cloud Datastore User" or "Editor" role.

### Products not appearing in Firestore
**Solution:** 
1. Verify collection name matches: `products`
2. Check Firebase Console → Firestore Database
3. Confirm script output shows "Committed X docs..."

---

## 🧪 Testing the Seeding

After running the script:

1. **Firebase Console:**
   - Navigate to Firestore Database
   - Check the `products` collection
   - Verify documents exist with SKU-based IDs

2. **Main Application:**
   - Switch main app from FakeStoreAPI to Firebase
   - Products should load in the catalog
   - Verify images, descriptions, and prices display correctly

3. **Query Products:**
   ```javascript
   // Example query in your app
   const productsRef = collection(db, "products");
   const querySnapshot = await getDocs(productsRef);
   querySnapshot.forEach((doc) => {
     console.log(doc.id, " => ", doc.data());
   });
   ```

---

## 🔄 Migration from FakeStoreAPI

This seeding utility is designed to replace the external FakeStoreAPI with your own Firebase-backed product database. Benefits include:

- ✅ **Full control** over product data and schema
- ✅ **Persistent writes** (unlike FakeStoreAPI's mock responses)
- ✅ **Custom fields** (add inventory, ratings, reviews, etc.)
- ✅ **Real-time updates** via Firestore listeners
- ✅ **Scalable** for production e-commerce needs

---

## 📚 Additional Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firestore Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 📧 Support

For issues related to:
- **Seeding script** → Check this README and script comments
- **Firebase setup** → [Firebase Console](https://console.firebase.google.com/)
- **Main application** → See the root `README.md`
