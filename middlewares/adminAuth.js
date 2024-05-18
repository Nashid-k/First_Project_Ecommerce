const User = require('../models/userModel')
const is_login = async(req,res,next)=>{
    try{
        if(req.session.adminId){
            next()
        }
        else{
            res.redirect('/admin')
        }
    }
    catch(error){
        console.log(error.message);
    }
}

const is_logout = async(req,res,next)=>{
    try{
       if(req.session.adminId){
        res.redirect('/admin')
       }else{
        next()
       }
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {is_login,
    is_logout}