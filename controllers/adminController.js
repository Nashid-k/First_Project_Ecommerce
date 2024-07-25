const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const moment = require("moment");
const Order = require("../models/orderModel");


const renderLogin = async (req, res) => {
  try {
    return res.redirect("/admin/login");
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect("/admin/login");
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const loadLogin = async (req, res) => {
  try {
    if (req.session.isAdmin) {
      return res.redirect("/admin/dashboard");
    } else {
      return res.render("login");
    }
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/admin/login");
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (passwordMatch) {
      if (!userData.is_admin) {
        req.flash("error", "You are not authorized to login");
        return res.redirect("/admin/login");
      } else {
        req.session.adminId = userData._id;
        req.session.isAdmin = true;
        return res.redirect("/admin/dashboard");
      }
    } else {
      req.flash("error", "Email or password is incorrect");
      return res.redirect("/admin/login");
    }
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const renderCustomer = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });
    const formattedUserData = userData.map((user) => {
      const joinedAtFormatted = moment(user.joinedAt).format("DD/MM/YYYY");
      return { ...user.toObject(), joinedAtFormatted };
    });
    return res.render("customers", { userData: formattedUserData });
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`google oauth ${userId}`);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { block: true } },
      { new: true }
    );
    console.log(updatedUser);
    return res
      .status(200)
      .send({
        message: "User blocked successfully",
        redirect: "/admin/customers",
      });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { block: false } },
      { new: true }
    );
    return res
      .status(200)
      .send({
        message: "User unblocked successfully",
        redirect: "/admin/customers",
      });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};



const loadDashboard = async (req, res) => {
  try {
    const allOrders = await Order.find().populate({
      path: "orderedItem.productId",
      populate: {
        path: "category",
        model: "Category",
      },
    });

    let deliveredOrders = [];
    let returnedOrders = [];
    let cancelledOrders = [];

    let totalRevenue = 0;
    let currentMonthEarnings = 0;

    const productPurchaseCount = {};
    const categoryPurchaseCount = {};

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    allOrders.forEach((order) => {
      const orderDate = new Date(order.orderDate);

      order.orderedItem.forEach((item) => {
        const productId = item.productId._id.toString();
        const categoryName =
          (item.productId.category && item.productId.category.name) ||
          "Unknown";

        if (item.status === "delivered") {
          deliveredOrders.push(order);
        } else if (item.status === "returned") {
          returnedOrders.push(order);
        } else if (item.status === "cancelled") {
          cancelledOrders.push(order);
        }

        if (item.status !== "cancelled" && item.status !== "returned") {
          totalRevenue += item.priceAtPurchase * item.quantity;
          if (
            orderDate.getMonth() === thisMonth &&
            orderDate.getFullYear() === thisYear
          ) {
            currentMonthEarnings += item.priceAtPurchase * item.quantity;
          }

          // Count product purchases
          if (!productPurchaseCount[productId]) {
            productPurchaseCount[productId] = {
              name: item.productId.name || "Unknown",
              count: 0,
            };
          }
          productPurchaseCount[productId].count += item.quantity;

          // Count category purchases
          if (!categoryPurchaseCount[categoryName]) {
            categoryPurchaseCount[categoryName] = 0;
          }
          categoryPurchaseCount[categoryName] += item.quantity;
        }
      });
    });

    const totalOrders = allOrders.length;
    const totalReturns = returnedOrders.length;
    const totalCancellations = cancelledOrders.length;

    // Get top 10 products
    const topProducts = Object.values(productPurchaseCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top 10 categories
    const topCategories = Object.entries(categoryPurchaseCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const chartData = {
      sales: {
        labels: ["Total Revenue"],
        data: [totalRevenue],
      },
      orders: {
        labels: ["Delivered", "Returned", "Cancelled"],
        data: [
          deliveredOrders.length,
          returnedOrders.length,
          cancelledOrders.length,
        ],
      },
      totalOrders: totalOrders,
    };

    res.render("dashboard", {
      deliveredOrders,
      totalOrders,
      totalRevenue,
      totalReturns,
      totalCancellations,
      monthlyEarning: currentMonthEarnings,
      chartData: JSON.stringify(chartData),
      topProducts,
      topCategories,
    });
  } catch (error) {
    console.log("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
};

const generateData = async (req, res) => {
  const reportType = req.query.reportType;
  console.log("generateData called with reportType:", req.query.reportType);
  try {
    const totalOrders = await Order.countDocuments();
    const now = new Date();
    let labels = [];
    let salesData = [];
    let ordersData = [];

    switch (reportType) {
      case "daily":
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        for (let i = 0; i < 24; i++) {
          const startHour = new Date(now);
          startHour.setHours(i, 0, 0, 0);
          const endHour = new Date(now);
          endHour.setHours(i + 1, 0, 0, 0);

          const orders = await Order.find({
            createdAt: { $gte: startHour, $lt: endHour },
          });

          ordersData.push(orders.length);
          salesData.push(
            orders.reduce((sum, order) => sum + order.orderAmount, 0)
          );
        }
        break;

      case "weekly":
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));

          const startDay = new Date(date);
          startDay.setHours(0, 0, 0, 0);
          const endDay = new Date(date);
          endDay.setHours(23, 59, 59, 999);

          const orders = await Order.find({
            createdAt: { $gte: startDay, $lte: endDay },
          });

          ordersData.push(orders.length);
          salesData.push(
            orders.reduce((sum, order) => sum + order.orderAmount, 0)
          );
        }
        break;

      case "monthly":
        const daysInMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          labels.push(i.toString());

          const startDay = new Date(date);
          startDay.setHours(0, 0, 0, 0);
          const endDay = new Date(date);
          endDay.setHours(23, 59, 59, 999);

          const orders = await Order.find({
            createdAt: { $gte: startDay, $lte: endDay },
          });

          ordersData.push(orders.length);
          salesData.push(
            orders.reduce((sum, order) => sum + order.orderAmount, 0)
          );
        }
        break;

      case "yearly":
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          labels.push(date.toLocaleDateString("en-US", { month: "short" }));

          const startMonth = new Date(now.getFullYear(), i, 1);
          const endMonth = new Date(now.getFullYear(), i + 1, 0);

          const orders = await Order.find({
            createdAt: { $gte: startMonth, $lte: endMonth },
          });

          ordersData.push(orders.length);
          salesData.push(
            orders.reduce((sum, order) => sum + order.orderAmount, 0)
          );
        }
        break;

      default:
        break;
    }

    const data = {
      sales: { labels: labels, data: salesData },
      orders: { labels: labels, data: ordersData },
      totalOrders: totalOrders,
    };

    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Error fetching dashboard data");
  }
};

module.exports = {
  renderLogin,
  verifyLogin,
  loadLogin,
  loadDashboard,
  renderCustomer,
  blockUser,
  unblockUser,
  generateData,
  loadLogout,
};
