# 🛒 Complete E-commerce Platform

A full-featured **E-commerce web application** built with **Node.js**, **Express**, **EJS**, and **MongoDB**. This comprehensive platform includes everything from user authentication to payment processing, providing a complete online shopping experience.

🔗 **GitHub Repository**: [https://github.com/Nashid-k/First_Project_Ecommerce](https://github.com/Nashid-k/First_Project_Ecommerce)  
📦 **Stack**: Node.js | Express | EJS | MongoDB | Google OAuth | Razorpay

---

## 🎯 Project Overview

This is my **first complete e-commerce project**, showcasing a full-stack web application with modern authentication methods, payment integration, and comprehensive admin/user management systems. The platform demonstrates practical implementation of various web development concepts and third-party service integrations.

---

## ✨ Key Features

### 🔐 **Authentication & Security**
- **Google OAuth Integration** - Sign in with Google account
- **Email OTP Verification** - Two-factor authentication via email
- **Session Management** - Secure user sessions
- **Route Protection** - Middleware-based access control

### 👤 **User Features**
- **User Dashboard** - Personalized user interface
- **Product Browsing** - View and search products
- **Shopping Cart** - Add, remove, and modify cart items
- **Wishlist** - Save favorite products for later
- **Checkout Process** - Streamlined order placement
- **Order History** - Track past purchases
- **Profile Management** - Update user information

### 🛡️ **Admin Panel**
- **Admin Dashboard** - Comprehensive management interface
- **Product Management** - Add, edit, delete products
- **Order Management** - View and process orders
- **User Management** - Monitor and manage users
- **Inventory Control** - Stock management
- **Sales Analytics** - Track business metrics

### 💳 **Payment & Orders**
- **Razorpay Integration** - Secure online payments
- **Cash on Delivery (COD)** - Alternative payment option
- **Order Tracking** - Real-time order status updates
- **Payment Verification** - Secure transaction handling
- **Receipt Generation** - Order confirmations and invoices

### 🎨 **User Experience**
- **Responsive Design** - Mobile-friendly interface
- **EJS Templates** - Dynamic server-side rendering
- **Error Handling** - Graceful error management
- **Loading States** - User feedback during operations

---

## 🗂️ Project Structure

```
ecommerce-platform/
├── controllers/         # Business logic and route handlers
├── middlewares/         # Authentication and validation middleware
├── models/             # MongoDB schemas and data models
├── public/             # Static assets (CSS, JS, images)
├── routes/             # API and page routes
├── utils/              # Helper functions and utilities
├── views/              # EJS templates and partials
├── node_modules/       # Dependencies
├── .gitignore          # Git ignore rules
├── index.js            # Main server entry point
├── package.json        # Project metadata and dependencies
├── package-lock.json   # Exact dependency versions
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or Atlas)
- **Google Developer Account** (for OAuth)
- **Razorpay Account** (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nashid-k/First_Project_Ecommerce.git
   cd First_Project_Ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/ecommerce-db
   
   # Session Secret
   SESSION_SECRET=your-secret-key-here
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Email Configuration (for OTP)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```

4. **Database Setup**
   - Start MongoDB service
   - The application will automatically create required collections

5. **Run the application**
   ```bash
   npm start
   ```
   or for development:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - **User Interface**: `http://localhost:3000`
   - **Admin Panel**: `http://localhost:3000/admin`

---

## 🛠️ Technologies Used

### **Backend Technologies**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### **Frontend Technologies**
- **EJS** - Template engine
- **HTML5/CSS3** - Markup and styling
- **JavaScript** - Client-side scripting
- **Bootstrap** - CSS framework (if used)

### **Authentication & Security**
- **Google OAuth 2.0** - Social authentication
- **Express-session** - Session management
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service for OTP

### **Payment Integration**
- **Razorpay** - Payment gateway
- **Webhook handling** - Payment verification

### **Development Tools**
- **Nodemon** - Development server
- **Git** - Version control

---

## 📱 Usage Guide

### **For Users:**
1. **Registration/Login** - Sign up via email or Google OAuth
2. **Browse Products** - Explore the product catalog
3. **Add to Cart** - Select items for purchase
4. **Wishlist** - Save products for later
5. **Checkout** - Complete purchase with payment or COD
6. **Track Orders** - Monitor order status

### **For Admins:**
1. **Login** - Access admin panel with admin credentials
2. **Manage Products** - Add, edit, or remove products
3. **Process Orders** - View and update order status
4. **User Management** - Monitor user accounts
5. **Analytics** - View sales and performance data

---

## 🔧 Configuration

### **Google OAuth Setup:**
1. Create a project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs

### **Razorpay Setup:**
1. Create a Razorpay account
2. Generate API keys from dashboard
3. Configure webhook endpoints for payment verification

### **Email Configuration:**
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password
3. Configure SMTP settings

---

## 🐛 Common Issues & Solutions

### **MongoDB Connection Issues**
```bash
# Ensure MongoDB is running
sudo service mongod start
# Or for macOS
brew services start mongodb-community
```

### **Google OAuth Errors**
- Verify redirect URIs match exactly
- Check client ID and secret configuration
- Ensure Google+ API is enabled

### **Payment Integration Issues**
- Validate Razorpay API keys
- Check webhook URL configuration
- Verify SSL certificate for production

---

## 🚀 Deployment

### **Production Checklist**
- [ ] Set NODE_ENV to 'production'
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS for OAuth and payments
- [ ] Configure production database
- [ ] Set up proper error logging
- [ ] Implement rate limiting
- [ ] Optimize static assets

---

## 🎓 Learning Outcomes

This project helped me gain experience in:

- **Full-Stack Development** - Complete web application architecture
- **Authentication Systems** - Multiple authentication methods
- **Payment Integration** - Real-world payment processing
- **Database Design** - MongoDB schema design and relationships
- **API Development** - RESTful API design and implementation
- **Security Best Practices** - Session management and data protection
- **Third-Party Integration** - OAuth, payment gateways, email services

---

## 🔮 Future Enhancements

- [ ] **Search & Filtering** - Advanced product search
- [ ] **Product Reviews** - User rating and review system
- [ ] **Inventory Alerts** - Low stock notifications
- [ ] **Discount System** - Coupons and promotional codes
- [ ] **Analytics Dashboard** - Advanced business insights
- [ ] **Multi-vendor Support** - Marketplace functionality

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact

**Nashid K** - [nashidk1999@gmail.com](mailto:nashidk1999@gmail.com)

Project Link: [https://github.com/Nashid-k/First_Project_Ecommerce](https://github.com/Nashid-k/First_Project_Ecommerce)

---

## 🙏 Acknowledgments

- **Razorpay** for seamless payment integration
- **Google** for OAuth 2.0 authentication services
- **MongoDB** community for excellent documentation
- **Express.js** and **Node.js** communities for robust frameworks
- **EJS** for powerful templating capabilities

---
