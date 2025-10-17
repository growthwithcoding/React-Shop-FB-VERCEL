// flush-firestore.mjs
// Flushes all Firestore data EXCEPT the test user with ID: lhoijzfg2ya5Z7LzY2RBiWBI3sa2

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Resolve folder (Windows-safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Init Admin SDK
const SERVICE_JSON = path.join(__dirname, "..", "firebase-admin.json");
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_JSON, "utf8"));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

// The test user ID to preserve
const PRESERVE_USER_ID = "lhoijzfg2ya5Z7LzY2RBiWBI3sa2";

// Collection names to flush
const COLLECTIONS_TO_FLUSH = [
  "products",
  "orders",
  "discounts",
  "addresses",
  "users",
  "paymentMethods",
  "settings",
  "content"
];

/**
 * Delete all documents in a collection, optionally preserving specific document IDs
 */
async function deleteCollection(collectionName, preserveIds = []) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(500);
  
  let deletedCount = 0;
  let skippedCount = 0;

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });

  async function deleteQueryBatch(query, resolve, reject) {
    try {
      const snapshot = await query.get();

      if (snapshot.size === 0) {
        console.log(`  ${collectionName}: Deleted ${deletedCount} docs, preserved ${skippedCount} docs`);
        resolve();
        return;
      }

      const batch = db.batch();
      let batchCount = 0;

      snapshot.docs.forEach((doc) => {
        if (preserveIds.includes(doc.id)) {
          skippedCount++;
          if (skippedCount === 1) {
            console.log(`  Preserving ${collectionName}/${doc.id}`);
          }
        } else {
          batch.delete(doc.ref);
          batchCount++;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
        deletedCount += batchCount;
        
        // Only recurse if we deleted something (meaning there might be more to delete)
        process.nextTick(() => {
          deleteQueryBatch(query, resolve, reject);
        });
      } else {
        // All remaining documents are preserved, we're done
        console.log(`  ${collectionName}: Deleted ${deletedCount} docs, preserved ${skippedCount} docs`);
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  }
}

/**
 * Also delete addresses and payment methods associated with non-preserved users
 */
async function deleteUserRelatedData(preserveUserIds) {
  // Delete addresses not belonging to preserved users
  const addressesRef = db.collection("addresses");
  const addressSnapshot = await addressesRef.get();
  
  let addressDeletedCount = 0;
  let addressBatch = db.batch();
  let addressBatchCount = 0;
  
  for (const doc of addressSnapshot.docs) {
    const data = doc.data();
    if (!preserveUserIds.includes(data.userId)) {
      addressBatch.delete(doc.ref);
      addressBatchCount++;
      addressDeletedCount++;
      
      if (addressBatchCount >= 500) {
        await addressBatch.commit();
        addressBatch = db.batch();
        addressBatchCount = 0;
      }
    }
  }
  
  if (addressBatchCount > 0) {
    await addressBatch.commit();
  }
  
  if (addressDeletedCount > 0) {
    console.log(`  Deleted ${addressDeletedCount} addresses not belonging to preserved users`);
  }

  // Delete payment methods not belonging to preserved users
  const paymentMethodsRef = db.collection("paymentMethods");
  const paymentSnapshot = await paymentMethodsRef.get();
  
  let paymentDeletedCount = 0;
  let paymentBatch = db.batch();
  let paymentBatchCount = 0;
  
  for (const doc of paymentSnapshot.docs) {
    const data = doc.data();
    if (!preserveUserIds.includes(data.userId)) {
      paymentBatch.delete(doc.ref);
      paymentBatchCount++;
      paymentDeletedCount++;
      
      if (paymentBatchCount >= 500) {
        await paymentBatch.commit();
        paymentBatch = db.batch();
        paymentBatchCount = 0;
      }
    }
  }
  
  if (paymentBatchCount > 0) {
    await paymentBatch.commit();
  }
  
  if (paymentDeletedCount > 0) {
    console.log(`  Deleted ${paymentDeletedCount} payment methods not belonging to preserved users`);
  }
}

// --- Main execution
(async () => {
  console.log("🔥 FLUSHING FIRESTORE DATABASE");
  console.log("Project ID:", serviceAccount.project_id);
  console.log(`Preserving user: ${PRESERVE_USER_ID}\n`);

  // Confirm before proceeding
  console.log("⚠️  WARNING: This will delete all data except the test user!");
  console.log("Press Ctrl+C within 3 seconds to cancel...\n");
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("Starting flush...\n");

  // Delete each collection (preserving test user in users collection)
  for (const collectionName of COLLECTIONS_TO_FLUSH) {
    console.log(`Flushing ${collectionName}...`);
    
    if (collectionName === "users") {
      // Preserve the test user
      await deleteCollection(collectionName, [PRESERVE_USER_ID]);
    } else {
      // Delete everything
      await deleteCollection(collectionName, []);
    }
  }

  // Delete user-related data for non-preserved users
  console.log("\nCleaning up user-related data...");
  await deleteUserRelatedData([PRESERVE_USER_ID]);

  console.log("\n✅ Firestore flush complete!");
  console.log(`Test user ${PRESERVE_USER_ID} has been preserved.`);
  console.log("\nYou can now run: node seed-store.mjs");
  
  process.exit(0);
})().catch(err => {
  console.error("❌ Error flushing Firestore:", err);
  process.exit(1);
});
