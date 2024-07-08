const User = require('../models/userModel'); 
const Wallet = require('../models/walletModel'); 

const renderWallet = async (req, res) => {
    try {
        
        if (!req.session.userId) {
            req.flash("error", "Please log in to view your wallet");
            return res.redirect("/login");
        }

        const userId = req.session.userId;
        


        const user = await User.findById(userId);
        if (!user) {
            console.error(`User not found for id: ${userId}`);
            req.flash("error", "User account not found. Please log in again.");
            return res.redirect("/login");
        }

       
        const wallet = await Wallet.findOne({ userId: userId });
        if (!wallet) {
            console.error(`Wallet not found for user: ${userId}`);
            req.flash("error", "Wallet not found. Please try again later.");
            return res.redirect("/");
        }

    
        wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  
        res.render("wallet", {
            title: "Your Wallet",
            balance: wallet.balance,
            transactions: wallet.transactions,
            userData:user
            
        });
    } catch (error) {
        console.error("Error in renderWallet:", error);
        req.flash("error", "An unexpected error occurred. Please try again.");
        res.redirect("/");
    }
};


const addMoneyToWallet = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = req.session.userId;
        const { amount } = req.body;

        const amountFloat = parseFloat(amount);

        if (isNaN(amountFloat) || amountFloat <= 0 || amountFloat > 10000) {
            req.flash("error", "Invalid amount. Please enter a value between 1 and 10000.");
            return res.redirect("/wallet");
        }

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0, transactions: [] });
        }

        wallet.balance += amountFloat;
        wallet.transactions.push({
            amount: amountFloat,
            transactionMethod: "Credit",
            date: new Date(),
            description: "Added to wallet"
        });

        await wallet.save();

        req.flash("message", `₹${amountFloat.toFixed(2)} added to your wallet successfully`);
        res.redirect("/wallet");
    } catch (error) {
        console.error("Error in addMoneyToWallet:", error);
        req.flash("error", "Failed to add money. Please try again.");
        res.redirect("/wallet");
    }
};

module.exports = {
    renderWallet,
    addMoneyToWallet,
};
