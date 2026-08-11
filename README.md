<!-- ══════════════════════════════════════════════════════════════════ -->
<!--                 NASHID K  —  FIRST PROJECT ECOMMERCE               -->
<!-- ══════════════════════════════════════════════════════════════════ -->

# 🛒 Complete E-commerce Platform (MVC Node.js)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=nodedotjs" alt="Node" />
  &nbsp;
  <img src="https://img.shields.io/badge/Express-4.x-lightgrey?style=flat-square&logo=express" alt="Express" />
  &nbsp;
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square&logo=mongodb" alt="MongoDB" />
  &nbsp;
  <img src="https://img.shields.io/badge/EJS-Views-orange?style=flat-square" alt="EJS" />
  &nbsp;
  <img src="https://img.shields.io/badge/Payment-Razorpay-blue?style=flat-square" alt="Razorpay" />
</p>

<p align="center">
  <strong>A full-featured E-commerce application implementing MVC architecture, user wallets, category filters, Razorpay payments, and OTP validation.</strong>
</p>

---

## 📌 Project Overview
Built using Express, EJS dynamic views, and MongoDB, this project serves as a comprehensive MVC showcase. It includes administrative control panels, sales report generators, cart workflows, and checkout logic.

### ✨ Features
*   **Checkout & Checkout Systems:** Razorpay checkout flow, user wallet balance processing, and coupon discounts.
*   **Admin Panel:** Create/Edit products, category management, sales statistics, and PDF reports.
*   **Security:** OTP-based verification during registration and bcrypt password protections.
*   **Clean History:** Untracked node_modules to guarantee fast clone speeds.

---

## 📂 Folder Architecture

```text
├── controllers/  # Route controller handlers (User, Cart, Coupon, Order)
├── models/       # Mongoose models (Cart, Category, Product, Address)
├── middlewares/  # Authentication checks (User / Admin)
├── views/        # EJS dynamic page views
└── index.js      # App configurations
```

---

## ⚙️ Local Setup
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Nashid-k/First_Project_Ecommerce.git
   cd First_Project_Ecommerce
   ```
2. **Install Packages:**
   ```bash
   npm install
   ```
3. **Boot Application:**
   ```bash
   npm start
   ```
