// update-discount-categories.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_JSON = path.join(__dirname, "firebase-admin.json");
const DISCOUNTS_JSON = path.join(__dirname, "discountsSeed.json");

// Init Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_JSON, "utf8"));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

async function getActualCategories() {
  console.log("Fetching actual categories from Firestore...");
  const productsSnap = await db.collection("products").get();
  const categories = new Set();
  
  productsSnap.forEach(doc => {
    const data = doc.data();
    if (data.category) {
      categories.add(data.category);
    }
  });
  
  const categoryList = Array.from(categories).sort();
  console.log("Found categories:", categoryList);
  return categoryList;
}

async function updateDiscounts() {
  try {
    const categories = await getActualCategories();
    
    if (categories.length === 0) {
      console.error("No categories found in Firestore!");
      process.exit(1);
    }
    
    // Read existing discounts
    const discounts = JSON.parse(fs.readFileSync(DISCOUNTS_JSON, "utf8"));
    
    // Site-wide discounts (keep as-is)
    const siteWideDiscounts = discounts.filter(d => d.scope === "site-wide");
    
    // Create category-specific discounts for each actual category
    const categoryDiscounts = categories.map((category, index) => {
      const code = category.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) + (10 + index * 5);
      return {
        id: code,
        code: code,
        type: "percentage",
        value: 15 + (index % 3) * 5, // 15%, 20%, or 25%
        description: `Discount on ${category}`,
        category: category,
        minPurchaseUSD: 30 + (index % 3) * 20,
        maxDiscountUSD: 50 + (index % 3) * 25,
        validFrom: "2024-01-01",
        validUntil: "2026-12-31",
        usageLimit: 500 + index * 100,
        usageCount: 0,
        isActive: true,
        stackable: true,
        scope: "category"
      };
    });
    
    // Keep item-specific discounts (update productId to actual SKU if needed)
    const itemDiscounts = discounts.filter(d => d.scope === "item");
    
    // Combine all discounts
    const updatedDiscounts = [
      ...siteWideDiscounts,
      ...categoryDiscounts,
      ...itemDiscounts
    ];
    
    // Write back to file
    fs.writeFileSync(
      DISCOUNTS_JSON,
      JSON.stringify(updatedDiscounts, null, 2)
    );
    
    console.log(`\n✅ Updated discounts with ${categoryDiscounts.length} category-specific codes`);
    console.log("Category discounts created:");
    categoryDiscounts.forEach(d => {
      console.log(`  - ${d.code}: ${d.value}% off ${d.category}`);
    });
    
    console.log("\nRun: node seed-store.mjs --discounts");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateDiscounts().then(() => process.exit(0));
