const Course = require("../models/Course")
const Category = require("../models/Category")
const User = require("../models/User")
const {uploadImageToCloudinary} = require("../utils/imageUploader");


//createCourse handler function

exports.createCourse = async(req,res) => {
    try{

        //fetch data
        let {
            courseName, 
            courseDescription, 
            whatYouWillLearn,
            price,
            category,
            tag,
            status,    
        } = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation 
        if(
            !courseName || 
            !courseDescription || 
            !whatYouWillLearn || 
            !price || 
            !thumbnail || 
            !category || 
            !tag
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        if (!status || status === undefined) {
			status = "Draft";
		}

        //check if the user ia an instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details", instructorDetails);
        //Need testing

        if(!instructorDetails) {
            return res.status(404).json({
                success: false,
                message:'Instructor Details not found'
            })
        }

        //check given category is valid or not
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails) {
            return res.status(404).json({
                success: false,
                message:'Category Details not found'
            });

        }

        //Upload Image top Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME)

        //create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            tag:tag,
            status: status,
            category:categoryDetails._id,
            thumbnail:thumbnailImage.secure_url,
        })

        //add the new course to the user schema of Instructor
        await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
            {
                $push:{
                    courses: newCourse._id,
                }
            
            },
            {new:true},
        );

        //update the Category ka Schema


        //return response
        return res.status(200).json({
            success:true,
            message:'Course Created Successfully',
            data:newCourse,

        });
        

    }
    catch(err) {
        console.log(err);
        return res.status(500).json({
            success:false,
            message: 'Failed to create a new course',
            error : err.message
        })

      }
}


// getAllCourses handler function

exports.getAllCourses = async (req,res) => {
    try {
        //get all the courses from the database
       
        const allCourses = await Course.find({});
        
        return res.status(200).json({
            success:true,
            message: 'Data for all courses fetched successfully',
            data:allCourses,
        })
        
        

    }
    catch(err) {
        console.log(err);
        return res.status(500).json({
            success:false,
            message: 'Failed to get all courses',
            error : err.message,
        })
    }
}

// getCourseDetails

exports.getCourseDetails  = async (req,res) => {

    try{

        //get Id
        const {courseId}  = req.body;
        //find course Details
        const courseDetails = await Course.find(
            {_id:courseId})
            .populate(
                {
                    path:'instructor',
                    populate:{
                        path:"additionalDetails"
                    }
                }
            )
            .populate("category")
            // .populate("ratingAndreviews")
            .populate({
                path: "courseContent",
                populate: {
                    path:"subSection",
                },
            })
            .exec();

        //Validation

        if(!courseDetails) {
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`,
            })
        }

        //return response
        return res.status(200).json({
            success:true,
            message:'Course Details fetched successfully',
            data: courseDetails,
        })

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message: err.message
        })

    }
}




 // ,{courseName:true,
        //     price:true,
        //     thumbnail:true,
        //     instructor:true,
        //     ratingAndReviews:true,
        //     studentsEnrolled:true,})
        //     .populate('instructor')
        //     .exec();
