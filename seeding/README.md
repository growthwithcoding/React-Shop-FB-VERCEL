# 🌱 Firebase Product Seeding Utility

[![Firebase_Admin](https://img.shields.io/badge/Firebase_Admin-13.5.0-orange)](https://www.npmjs.com/package/firebase-admin)
[![Node](https://img.shields.io/badge/Node-ES_Modules-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-ISC-blue)]()

This directory contains the **Firebase Product Seeding Utility** for populating your Firestore database with initial product data. The script uses the **Firebase Admin SDK** to batch-write products from a JSON file directly to your Firebase project.

---

## 📌 What this utility does

### Database Population
- **Batch writes** product data from `productSeed.json` to Firestore collection `products`.
- Uses **SKU as document ID** for predictable references and updates.
- Includes automatic **server timestamps** (`createdAt`, `updatedAt`) for all products.
- Processes up to **500 products per batch** for optimal performance.

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
cd store-seeder
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

```bash
node seed-products.mjs
```

You should see output like:

```
Project ID: your-project-id
Committed 23 docs...
Seeding complete.
```

---

## 📂 Directory Structure

```
seeding/
├─ firebase-admin.json          # Service account credentials (DO NOT COMMIT)
├─ firebase-admin.sample.json   # Template for credentials (SAFE to commit)
├─ package.json                 # Dependencies (firebase-admin)
├─ package-lock.json            # Lock file
├─ productSeed.json             # Sample product data (23 items)
├─ seed-products.mjs            # Seeding script
└─ README.md                    # This file
```

---

## 🗂️ Sample Product Categories

The included `productSeed.json` contains **23 products** across these categories:

- **Mechanical Keyboards** (4 products)
  - TKL, Split Ergonomic, 60%, Macro Pad
- **Programming Books** (4 products)
  - Clean Code, Git & CI/CD, APIs, Systems Design
- **Development Boards** (4 products)
  - ESP32-S3, Raspberry Pi 5, RP2040 Feather, Jetson Nano
- **Software Tools** (4 products)
  - IDE, QA Suite, API Client, DB Designer
- **Monitors** (2 products)
  - 27" 4K IPS, 34" Ultrawide QHD
- **Accessories** (3 products)
  - USB-C Dock, Bluetooth Mouse, Miscellaneous
- **Chairs** (2 products)
  - Ergonomic Mesh Chair, Active Stool

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

To update existing products or add new ones:

```bash
node seed-products.mjs
```

Products with matching SKUs will have their data updated (merge mode).

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
