const Section = require("../models/Section");
const Course = require("../models/Course");


exports.createSection = async (req, res) => {
    try{
        //Data fetch
        const {sectionName, courseId} = req.body;

        //data validation
        if(!sectionName || !courseId) {
            return res.status(400).json({
                success:false,
                message:"Missing Properties"
            })
        }
        //create section
        const newSection = await Section.create({sectionName});
        //udate course with section ObjectID

        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                    courseId,
                                    {
                                        $push:{
                                            courseContent:newSection._id,
                                        }
                                    },
                                    {new:true},
                                )
        //::: use populate to replace section/subsection both in updatedCourseDetails
        //return response

        return res.status(200).json({
            success:true,
            message:"Section Created Successfully",
            updatedCourseDetails,
        })

    }
    catch(err) {

        return res.status(500).json({
            success:false,
            message:"Unable to create Section, please try again",
            error: err.message,
        })

    }
}

exports.updateSection = async (req,res) => {
    try{
        // Data fetch
        const {sectionName, sectionId} = req.body;
        //data validation
        if(!sectionName || !sectionId) {
            return res.status(400).json({
                success:false,
                message:"Missing Properties"
                })
        }
        //update section
        const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});
            
        // return response
        return res.status(200).json({
            success:true,
            message:'Section Updated Successfully'

        })
    }
    catch(err) {

        return res.status(500).json({
            success:false,
            message:"Unable to update Section, please try again",
            error: err.message,
        })

    }
};


exports.deleteSection = async (req,res) => {
    try{
        // Data fetch ID = assuming that we are sending ID in params
        const {sectionId,courseId} = req.body;
        //data validation
        if(!sectionId || !courseId) {
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            })
        }
        //delete section
        await Section.findByIdAndDelete(sectionId);
        // ::::TODO [Testing]::::
        //return response
        return res.status(200).json({
            success:true,
            message: "Section Deleted Successfully",
        })
    }

    catch(err){

        return res.status(500).json({
            success:false,
            message:"Unable to delete Section, please try again",
            error: err.message,
        })

    }
}