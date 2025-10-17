// seed.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// --- Resolve folder (Windows-safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Files (rename here if your filenames differ)
const SERVICE_JSON   = path.join(__dirname, "..", "firebase-admin.json");
const PRODUCTS_JSON  = path.join(__dirname, "productSeed.json");
const USERS_JSON     = path.join(__dirname, "usersSeed.json");
const ORDERS_JSON    = path.join(__dirname, "ordersSeed.json");
const DISCOUNTS_JSON = path.join(__dirname, "discountsSeed.json");
const SUPPORT_TICKETS_JSON = path.join(__dirname, "supportTicketsSeed.json");
const TICKET_REPLIES_JSON = path.join(__dirname, "ticketRepliesSeed.json");

// --- Init Admin SDK (explicit project)
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_JSON, "utf8"));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

// --- CLI flags
const flags = new Set(process.argv.slice(2));
const runUsers     = flags.has("--users");
const runProducts  = flags.has("--products");
const runOrders    = flags.has("--orders");
const runDiscounts = flags.has("--discounts");
const runTickets   = flags.has("--tickets");
const runReplies   = flags.has("--replies");
const runAll = !runUsers && !runProducts && !runOrders && !runDiscounts && !runTickets && !runReplies; // no flags -> seed everything

// --- Utils
function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
const r2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// --- Seed USERS
async function seedUsers(collectionName = "users") {
  const users = JSON.parse(fs.readFileSync(USERS_JSON, "utf8"));
  if (!Array.isArray(users)) throw new Error("usersSeed.json must be an array");

  const map = new Map();
  const chunks = chunk(users, 400);
  let wrote = 0;

  for (const slice of chunks) {
    const batch = db.batch();
    for (const u of slice) {
      if (!u.userId) throw new Error("User missing userId");
      if (!u.email) throw new Error(`User ${u.userId} missing email`);
      const ref = db.collection(collectionName).doc(u.userId);
      map.set(u.userId, u);
      batch.set(ref, {
        ...u,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
    wrote += slice.length;
    console.log(`Users: committed ${slice.length} docs...`);
  }
  console.log(`Users: seeded ${wrote} docs to '${collectionName}'.`);
  
  // Seed addresses from user data into separate addresses collection
  await seedAddresses(users);
  
  return map;
}

// --- Seed ADDRESSES (from user addresses)
async function seedAddresses(users) {
  const addressesCol = db.collection("addresses");
  let wrote = 0;
  
  for (const user of users) {
    if (!user.addresses || !Array.isArray(user.addresses)) continue;
    
    const batch = db.batch();
    for (let i = 0; i < user.addresses.length; i++) {
      const addr = user.addresses[i];
      const addressId = `${user.userId}-addr-${i}`;
      const ref = addressesCol.doc(addressId);
      
      // Determine type from label or default to shipping
      let type = "shipping";
      if (addr.label === "billing") type = "billing";
      
      batch.set(ref, {
        userId: user.userId,
        type: type,
        line1: addr.line1 || "",
        line2: addr.line2 || "",
        city: addr.city || "",
        state: addr.region || addr.state || "",
        postalCode: addr.postalCode || "",
        country: addr.country || "US",
        isDefault: addr.label === "default" || i === 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      wrote++;
    }
    
    if (user.addresses.length > 0) {
      await batch.commit();
    }
  }
  
  if (wrote > 0) {
    console.log(`Addresses: seeded ${wrote} docs to 'addresses'.`);
  }
}

// --- Seed PRODUCTS
async function seedProducts(collectionName = "products") {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  if (!Array.isArray(products)) throw new Error("productSeed.json must be an array");

  const map = new Map();
  const chunks = chunk(products, 400);
  let wrote = 0;

  for (const slice of chunks) {
    const batch = db.batch();
    for (const p of slice) {
      if (!p.sku) throw new Error(`Product missing sku: ${p.name ?? "?"}`);
      if (p.priceUSD < 0) throw new Error(`Product price cannot be negative for ${p.sku}`);
      if (p.inventory === undefined || p.inventory === null) throw new Error(`Product ${p.sku} missing inventory field`);
      if (p.inventory < 0) throw new Error(`Product inventory cannot be negative for ${p.sku}`);
      
      const ref = db.collection(collectionName).doc(p.sku);
      map.set(p.sku, p);
      batch.set(ref, {
        ...p,
        image: p.imageUrl || p.image, // Map imageUrl to image for frontend compatibility
        inventory: Number(p.inventory),
        priceUSD: Number(p.priceUSD),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
    wrote += slice.length;
    console.log(`Products: committed ${slice.length} docs...`);
  }
  console.log(`Products: seeded ${wrote} docs to '${collectionName}'.`);
  return map;
}

// --- Seed DISCOUNTS
async function seedDiscounts(collectionName = "discounts") {
  const discounts = JSON.parse(fs.readFileSync(DISCOUNTS_JSON, "utf8"));
  if (!Array.isArray(discounts)) throw new Error("discountsSeed.json must be an array");

  const chunks = chunk(discounts, 400);
  let wrote = 0;

  for (const slice of chunks) {
    const batch = db.batch();
    for (const d of slice) {
      if (!d.code) throw new Error("Discount missing code");
      const ref = db.collection(collectionName).doc(d.code);
      batch.set(ref, {
        ...d,
        validFrom: d.validFrom ? new Date(d.validFrom) : null,
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
    wrote += slice.length;
    console.log(`Discounts: committed ${slice.length} docs...`);
  }
  console.log(`Discounts: seeded ${wrote} docs to '${collectionName}'.`);
}

// --- Seed ORDERS (now uses userId -> DocumentReference)
async function seedOrders(collectionName = "orders", productsMap, usersMap) {
  const orders = JSON.parse(fs.readFileSync(ORDERS_JSON, "utf8"));
  if (!Array.isArray(orders)) throw new Error("ordersSeed.json must be an array");

  // Fallbacks if maps weren't passed (e.g., user used --orders only)
  if (!productsMap) {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
    productsMap = new Map(products.map(p => [p.sku, p]));
  }
  if (!usersMap) {
    const users = JSON.parse(fs.readFileSync(USERS_JSON, "utf8"));
    usersMap = new Map(users.map(u => [u.userId, u]));
  }

  const chunks = chunk(orders, 400);
  let wrote = 0;

  for (const slice of chunks) {
    const batch = db.batch();

    for (const o of slice) {
      if (!o.orderId) throw new Error("Order missing orderId");
      if (!o.userId) throw new Error(`Order ${o.orderId} missing userId`);
      if (!Array.isArray(o.items) || o.items.length === 0) throw new Error(`Order ${o.orderId} has no items`);

      const user = usersMap.get(o.userId);
      if (!user) throw new Error(`Order ${o.orderId} references unknown userId: ${o.userId}`);
      const userRef = db.collection("users").doc(o.userId);

      // Expand line items from product pricing
      const itemsExpanded = o.items.map(it => {
        const prod = productsMap.get(it.sku);
        if (!prod) throw new Error(`Order ${o.orderId} references unknown SKU: ${it.sku}`);
        const unitPriceUSD = Number(prod.priceUSD);
        if (!(unitPriceUSD > 0)) throw new Error(`Product price must be > 0 for ${it.sku}`);
        const qty = Number(it.qty);
        return {
          sku: it.sku,
          name: prod.name,
          unitPriceUSD,
          qty,
          lineTotalUSD: r2(unitPriceUSD * qty)
        };
      });

      const subtotalUSD = r2(itemsExpanded.reduce((s, x) => s + x.lineTotalUSD, 0));
      const shippingUSD = r2(Number(o.shippingUSD || 0));
      const taxRate = Number(o.taxRate || 0);
      const taxUSD = r2(subtotalUSD * taxRate);
      const totalUSD = r2(subtotalUSD + taxUSD + shippingUSD);

      const ref = db.collection(collectionName).doc(o.orderId);
      batch.set(ref, {
        orderId: o.orderId,
        userId: o.userId,
        userRef, // Firestore DocumentReference to users/{userId}
        // Optional snapshot for denormalized display:
        customerSnapshot: { name: user.name, email: user.email },
        currency: "USD",
        items: itemsExpanded,
        subtotalUSD,
        taxUSD,
        shippingUSD,
        totalUSD,
        taxRate,
        paymentMethod: o.paymentMethod || "card",
        shippingAddress: o.shippingAddress || null,
        status: o.status || "paid",
        placedAt: o.placedAt ? new Date(o.placedAt) : FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    wrote += slice.length;
    console.log(`Orders: committed ${slice.length} docs...`);
  }

  console.log(`Orders: seeded ${wrote} docs to '${collectionName}'.`);
}

// --- Seed SUPPORT TICKETS
async function seedSupportTickets(collectionName = "supportTickets") {
  const tickets = JSON.parse(fs.readFileSync(SUPPORT_TICKETS_JSON, "utf8"));
  if (!Array.isArray(tickets)) throw new Error("supportTicketsSeed.json must be an array");

  const chunks = chunk(tickets, 400);
  let wrote = 0;

  for (const slice of chunks) {
    const batch = db.batch();
    for (const t of slice) {
      if (!t.id) throw new Error("Support ticket missing id");
      if (!t.userId) throw new Error(`Ticket ${t.id} missing userId`);
      if (!t.subject) throw new Error(`Ticket ${t.id} missing subject`);
      
      const ref = db.collection(collectionName).doc(t.id);
      batch.set(ref, {
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt) : FieldValue.serverTimestamp(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : FieldValue.serverTimestamp(),
        readAt: t.readAt ? new Date(t.readAt) : null,
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
        closedAt: t.closedAt ? new Date(t.closedAt) : null,
        lastReplyAt: t.lastReplyAt ? new Date(t.lastReplyAt) : null
      }, { merge: true });
    }
    await batch.commit();
    wrote += slice.length;
    console.log(`Support Tickets: committed ${slice.length} docs...`);
  }
  console.log(`Support Tickets: seeded ${wrote} docs to '${collectionName}'.`);
}

// --- Seed TICKET REPLIES
async function seedTicketReplies(collectionName = "ticketReplies") {
  const replies = JSON.parse(fs.readFileSync(TICKET_REPLIES_JSON, "utf8"));
  if (!Array.isArray(replies)) throw new Error("ticketRepliesSeed.json must be an array");

  const chunks = chunk(replies, 400);
  let wrote = 0;

  for (const slice of chunks) {
    const batch = db.batch();
    for (const r of slice) {
      if (!r.id) throw new Error("Ticket reply missing id");
      if (!r.ticketId) throw new Error(`Reply ${r.id} missing ticketId`);
      if (!r.userId) throw new Error(`Reply ${r.id} missing userId`);
      
      const ref = db.collection(collectionName).doc(r.id);
      batch.set(ref, {
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
    wrote += slice.length;
    console.log(`Ticket Replies: committed ${slice.length} docs...`);
  }
  console.log(`Ticket Replies: seeded ${wrote} docs to '${collectionName}'.`);
}

// --- Run in dependency-safe order
(async () => {
  console.log("Project ID:", serviceAccount.project_id);

  let usersMap = null;
  let productsMap = null;

  if (runAll || runUsers) {
    usersMap = await seedUsers("users");
  }
  if (runAll || runProducts) {
    productsMap = await seedProducts("products");
  }
  if (runAll || runDiscounts) {
    await seedDiscounts("discounts");
  }
  if (runAll || runOrders) {
    await seedOrders("orders", productsMap, usersMap);
  }
  if (runAll || runTickets) {
    await seedSupportTickets("supportTickets");
  }
  if (runAll || runReplies) {
    await seedTicketReplies("ticketReplies");
  }

  console.log("Done.");
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
