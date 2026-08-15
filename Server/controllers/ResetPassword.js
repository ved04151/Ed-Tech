const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcryptjs");
const crypto = require("crypto")


// resetPasswordToken
exports.resetPasswordToken = async (req,res) => {
    try{
        // get email from req body
        const {email} = req.body;

        //check user for this email, email validation

        const user = await User.findOne({email:email});
        if (!user) {
            return res.json({
                success:false,
                message:'Your Email is not registered with us'
            });
        }
        //generate token 
        const token = crypto.randomUUID();
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
                                        {email:email},
                                        {
                                            token:token,
                                            resetPasswordExpires: Date.now() + 5*60*1000,
                                        },
                                        {new:true});

        //create url

        const url = `http://localhost:3000/update-password/${token}`
        
        //send mail containing the url
        
        await mailSender(email,
            "Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
        );
        
        //return response

        return res.status(200).json({
            success:true,
            message:'Email sent successfully, please check email and change Password'
        });
    }
    catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:'Something went wrong while sending reset password mail'
        })

    }




}



//resetPassword

exports.resetPassword = async(req,res) => {
   try{
        //data fetch
        const {password,confirmPassword,token} = req.body;
        //validation
        if(password !== confirmPassword) {
            return res.json({
                success:false,
                message:'Password and Confirm Password does not match'
            });
        }
        //get Userdetails from db using token
        const UserDetails = await User.findOne({token:token});
        //if no entry -- invalid token
        if(!UserDetails) {
            return res.json({
                success:false,
                message:'Invalid Token'
            })
        }
        //token time check
        if(UserDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success:false,
                message:'Token Expired,please regenerate your token'
            })
        }
        //Hash password
        const hashedPassword = await bcrypt.hash(password,10);
        
        //password update
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true}
        )
        //return response
        return res.status(200).json({
            success:true,
            message:'Password Updated Successfully'
            
        })
   }
   catch(err) {
    console.log(err);
    return res.status(500).json({
        success:false,
        message:'Something went wrong'
    })
   }
}