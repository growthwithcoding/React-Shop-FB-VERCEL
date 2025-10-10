// fix-user-id.mjs - Updates userId in Firestore to match Firebase Auth UID
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_JSON = path.join(__dirname, "firebase-admin.json");
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_JSON, "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

// Get the Firebase Auth UID and seeded userId from command line
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: node fix-user-id.mjs <FIREBASE_AUTH_UID> <SEEDED_USER_ID>");
  console.error("Example: node fix-user-id.mjs xyz123abc456 lhoijzfg2ya5Z7LzY2RBiWBI3sa2");
  process.exit(1);
}

const [firebaseAuthUid, seededUserId] = args;

console.log(`\nUpdating Firestore documents:`);
console.log(`  FROM userId: ${seededUserId}`);
console.log(`  TO userId:   ${firebaseAuthUid}\n`);

async function updateCollection(collectionName, uidField = "userId") {
  const snapshot = await db.collection(collectionName).where(uidField, "==", seededUserId).get();
  
  if (snapshot.empty) {
    console.log(`${collectionName}: No documents found with ${uidField}="${seededUserId}"`);
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    batch.update(doc.ref, { [uidField]: firebaseAuthUid });
    count++;
  });

  await batch.commit();
  console.log(`${collectionName}: Updated ${count} documents`);
}

(async () => {
  try {
    // Update users collection
    const userDoc = db.collection("users").doc(seededUserId);
    const userSnapshot = await userDoc.get();
    if (userSnapshot.exists()) {
      // Copy the document to the new UID and delete the old one
      const userData = userSnapshot.data();
      await db.collection("users").doc(firebaseAuthUid).set({
        ...userData,
        userId: firebaseAuthUid,
      });
      await userDoc.delete();
      console.log(`users: Moved document from ${seededUserId} to ${firebaseAuthUid}`);
    } else {
      console.log(`users: No document found for ${seededUserId}`);
    }

    // Update orders
    await updateCollection("orders", "userId");

    // Update addresses
    await updateCollection("addresses", "userId");

    // Update support tickets if they exist
    await updateCollection("supportTickets", "userId");

    console.log("\n✅ All documents updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error updating documents:", error);
    process.exit(1);
  }
})();
