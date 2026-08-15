const Profile = require("../models/Profile");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader")


exports.updateProfile = async (req,res) => {
    try {
        //get Data
        const {dateOfBirth = "" , about = "" ,contactNumber,gender} = req.body;
        //get userId
        const id = req.user.id;
        //validation
        if(!id || !contactNumber || !gender){
            return res.status(400).json({
                success: false,
                message:"All fields are required"
            })
        }
        //find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        
        //update profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        await profileDetails.save();

        //return response

        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            profileDetails,
        })

    }

    catch(err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: err.message

        })

    }
}


//Delete Account
//TODO:: schedule request

exports.deleteAccount = async (req,res) => {
    try {

        //get Id
        const id = req.user.id;

        //Validation
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message:"User not found",
            })
        }
        //Delete porfile
        await Profile.findByIdAndUpdate({_id:userDetails.additionalDetails});
        //TODO : unenroll user from all enrolled Courses
        //Delete User
        await User.findByIdAndDelete({_id:id});

        // return response

        return res.status(200).json({
            success: true,
            message: "Account Deleted Successfully",

        })

    }
    catch(err) {

        return res.status(500).json({
            success: false,
            message: "User cannot be deleted successfully",
        })

    }
}

exports.getAllUserDetails = async (req,res) => {
    try {

        //get id
        const id = req.user.id;

        //Validation and get user details
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        
        // return response
        return res.status(200).json({
            success: true,
            message:'User Data Fetched Successfully',
            data:userDetails,
        });


    }

    catch(err) {
        return res.status(500).json({
            success: false,
            message: "User cannot be fetched successfully",
            error: err.message,

        })

    }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
        // get picture
        const displayPicture = req.files.displayPicture
        // get user Id
        const userId = req.user.id
        // Upload your Image on Cloudinary
        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )
        console.log(image) 
        // Update user picture 
        const updatedPorfile = await User.findByIdAndUpdate(
            {_id: userId},
            {image: image.secure_url},
            {new : true}
        )
        // send response
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedPorfile,
        })

    }
    catch(err) {
        return res.status(500).json({
            success : false,
            message: err.message,
        })

    }
}

exports.getEnrolledCourses = async (req, res) => {
    try {
        // get user Id
        console.log("Before token Extarction")
        const userId = req.user.id
        // get enrolled courses
        const userDetails = await User.findOne({
            _id: userId,
        })
        .populate("courses")
        .exec()
        // validate user Details
        if(!userDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            })
        }
        console.log("after token Extarction")
        // return response
        return res.status(200).json({
            success : true,
            data: userDetails.courses
        })

    }
    catch(err) {
        return res.status(500).json({
            success : false,
            message : err.message,
        })

    }
}