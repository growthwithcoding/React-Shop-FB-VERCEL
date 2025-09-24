# 🛍️ Advanced React E‑Commerce Web App — V1 (first push)

[![Author](https://img.shields.io/badge/author-growthwithcoding-blue)](https://github.com/growthwithcoding)
![React](https://img.shields.io/badge/React-19.1.1-61dafb)
![Vite](https://img.shields.io/badge/Vite-7.1.6-9460f6)
![Router](https://img.shields.io/badge/React_Router-7.9.1-CA4245)
![Redux_Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.9.0-764abc)
![React_Query](https://img.shields.io/badge/React_Query-5.89.0-ff4154)
![Version](https://img.shields.io/badge/release-v1_(first_push)-orange)

This repository implements the **Module Project: FakeStore E‑Commerce App** using **React 19 + Vite 7**, with **React Router**, **Redux Toolkit** for cart state, and **React Query** for API fetching/caching.  
Data is provided by **[FakeStoreAPI](https://fakestoreapi.com/)** (great for practicing loading/error states and non‑persistent writes).

---

## 📌 What this V1 covers

### Product Catalog
- **Home** lists products via **React Query** (`getAllProducts`), showing **title, price, category, rating, description, image**, and an **Add to Cart** button.
- Image **fallback** is wired so broken API images swap to a placeholder (keeps the UI presentable).

### Category Navigation
- **CategorySelect** pulls options from **`/products/categories`** (no hardcoding).
- Switching the dropdown shows items from that category (via request or client cache).

### Shopping Cart (Redux Toolkit)
- **Cart slice** supports add/update/remove; **selectors** compute **count** and **totals**.
- Items can be added **directly from the Home list** and from the **Product Page**.
- Cart state persists in **`sessionStorage`** (reloads retain items/quantities).

### Checkout (Simulated)
- **Checkout page** clears Redux + sessionStorage on submit and confirms success.
- Coupon box supports your demo codes (`SAVE10`, `REACT20`, `CODINGTEMPLE`) and delivery math.

### Routing
- App routes include **Home**, **Product Details**, **Cart**, **Checkout**, **About**, **Contact**. Global **NavBar** shows a live cart count.

### Nice touches in this codebase
- **Search input** and **Sort dropdown** (client‑side) for a smoother catalog experience.
- **Testimonials** widget fed by local JSON, accessible stars.
- **Hero** section with safe images and a jump link into the product grid.

> FakeStoreAPI note: POST/PUT/DELETE respond with success but **don’t persist**. The UI handles that gracefully for demos.

---

## 🧰 Tech Stack (from `package.json`)
- **React** ^19.1.1, **Vite** ^7.1.6
- **React Router** ^7.9.1
- **Redux Toolkit** ^2.9.0 (+ **react‑redux** ^9.2.0)
- **React Query** ^5.89.0
- **Axios** ^1.12.2
- **EmailJS** ^3.2.0 (Contact page; no backend needed)

---

## 🚀 Getting Started

```bash
git clone https://github.com/growthwithcoding/advanced-shop.git
cd advanced-shop
npm install
npm run dev
# open http://localhost:5173
```

### Build & Preview
```bash
npm run build
npm run preview
```

---

## 📂 Project Structure (V1 snapshot)

```
advanced-shop/
├─ public/
│  └─ screenshots/                # hero.png, product.png, cart.png
├─ src/
│  ├─ api/
│  │  └─ fakestore.js             # product/category fetchers
│  ├─ app/
│  │  └─ store.js                 # Redux store
│  ├─ components/
│  │  ├─ AddToCartModal.jsx
│  │  ├─ BackToTop.jsx
│  │  ├─ Cart.jsx
│  │  ├─ CategorySelect.jsx
│  │  ├─ Footer.jsx
│  │  ├─ Hero.jsx
│  │  ├─ NavBar.jsx               # live cart badge
│  │  ├─ ProductCard.jsx          # image fallback + add-to-cart
│  │  ├─ SearchBar.jsx
│  │  └─ SortControl.jsx
│  ├─ data/
│  │  └─ testimonials.json
│  ├─ features/
│  │  ├─ cart/
│  │  │  ├─ cartSlice.js
│  │  │  └─ selectors.js
│  │  └─ ui/
│  │     └─ uiSlice.js
│  ├─ pages/
│  │  ├─ About.jsx
│  │  ├─ CartPage.jsx
│  │  ├─ CheckoutPage.jsx
│  │  ├─ Contact.jsx
│  │  ├─ Home.jsx
│  │  └─ ProductPage.jsx
│  ├─ utils/
│  │  ├─ money.js                 # currency helpers
│  │  └─ search.js                # (optional) search helpers
│  ├─ App.jsx
│  ├─ index.css
│  ├─ main.jsx
│  └─ styles.css
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package.json
└─ vite.config.js
```

---

## 🧪 Presentation Checklist (for the instructor demo)
- **Home →** products load (spinner if slow), each card has title/price/category/rating/desc/image.
- **Category dropdown →** switch categories; items change accordingly.
- **Add to cart →** from Home or Product page; **Navbar badge** updates immediately.
- **Cart →** quantity change, remove, totals & count update; refresh to prove session storage.
- **Checkout →** simulate order: clears Redux + sessionStorage; coupon codes demonstrate logic.
- **Images →** break one image URL on purpose to show the **placeholder** behavior.
- **Contact →** send a test via EmailJS (or show the wired form if keys are private).