const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs"); 
const jwt = require("jsonwebtoken"); 
const Profile = require("../models/Profile");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const passwordUpdated = require("../mail/templates/passwordUpdate")


// *****************************************************sendOTP************************************************************

exports.sendotp = async (req,res) => {

    try {
        //fetch email from request body
        const {email} = req.body;
        
        // check if user already exist
        const checkUserPresent = await User.findOne({email});

        // if user already exist, then return a response

        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:'User already registered'
            })
        }

        //generate OTP

        var otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        })
        console.log("OTP generated:", otp);

        // check unique otp or not
        let result = await OTP.findOne({otp: otp});

        while(result) {
            otp = otpGenerator(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            })
            result = await OTP.findOne({otp: otp})
        }

        const otpPayload = {email,otp};

        //create an entry for OTP in DB

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response successful
        res.status(200).json({
            success:true,
            message:'OTP Sent Successfully',
            otp,
        })


    }
    catch(err) {
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }

    
}

//****************************************************signUp********************************************************

exports.signup = async (req,res) => {
    
    try {

        //data fetch from request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        // Validate data

        if(
            !firstName || 
            !lastName || 
            !email || 
            !password || 
            !confirmPassword || 
            !otp){
            
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            })
        }


        // password match karlo
        if(password !== confirmPassword) {
            return res.status(403).json({
                success:false,
                message:'password and confirmPassword value does not match, please try again',
            })
        }

        //Check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({
                success:false,
                message: 'User is already registered',
            })
        }

        // find most recent OTP stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);

        //validate OTP
        if(recentOtp.length == 0) {
            //otp not found
            return res.status(400).json({
                success:false,
                message: 'otp not found'
            })
        } else if(otp !== recentOtp[0].otp) {
            //Invalid OTP
            return res.status(400).json({
                success:false,
                message:"Invalid Otp"
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        //entry create in DB

        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });


        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        return res.status(200).json({
            success:true,
            message:'User is registered Successfully',
            user,
        });

    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Please try again",
        })

    }
}

// **********************************LOGIN********************************************
exports.login = async (req,res) => {
    try{
        //get data from req body
        const {email,password} = req.body;
        //check if email and password is empty
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:'All fields are required, Please fill them',
            });
        }

        //user check exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message:"User is not registered. Please signUp first"
            })
        }

        //generate JWT after password matching
        if(await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload,process.env.JWT_SECRET, {
                expiresIn:"2h",
            });
            user.token = token;
            user.password = undefined;
            console.log(user)

            //create Cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message: 'Logged In successfully.'
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message:'Password is Incorrect'
            })
        }

        
    }

    catch(err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message:'Login Failure, please try again',
        })

    }
    
}


// *******************************************ChangePassword****************************************************
exports.changePassword = async(req, res) => {
    try {
        //get data from req body
        const userDetails = await User.findById(req.user.id)

        //get oldPassword, newPassword, confirmNewPassword
        const {oldPassword, newPassword, confirmNewPassword} = req.body;
        //validation
        const isPasswordMatch = await bcrypt.compare(
            oldPassword, 
            userDetails.password
        )
        if(!isPasswordMatch) {
            //if old password does not match return a 401 (Unauthorized) error
            return res.status(401).json({
                success:false,
                message: "The Password is incorrect"
            })
        }

        //Match new password and confirm new password
        if(newPassword !== confirmNewPassword) {
            // If new password and confirm new password do not match , return a 400 (Bad Request) error
            return res.status(400).json({
                success: false,
                message: "The password and confirm password does not match"
            })
        }

        //update pwd in DB
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            {password: encryptedPassword},
            {new : true}
        )
        //send mail -- Password updated
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            )
            console.log("Email sent successfully:", emailResponse.response);

        }
        catch(err){
            // If there/s an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error Occurred while sending email:", err);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error : err.message,
            })

        }
        //return response
        return res.status(200).json({
            emailResponse,
            success: true,
            message: "Password updated successfully"
        })

    }
    catch(err) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error Occurred While updating password",err);
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: err.message
        })

    }
    
}