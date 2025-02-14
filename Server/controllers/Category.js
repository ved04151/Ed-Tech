const Category = require("../models/Category");


// Create Category ka handler function

exports.createCategory = async (req, res) => {
    try{
        // fetch data
         const {name, description} = req.body;

         //validation
         if(!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
         }

         //create entry in DB
         const tagDetails = await Category.create({
            name:name,
            description:description
         });
         console.log(tagDetails);
         //return response

         return res.status(200).json({
            success: true,
            message: "Category created successfully",
         })
    }
    catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message,
        })

    }
}

// getAllCategories Handler function

exports.showAllCategories  = async(req,res) => {
    try{
        const allCategories = await Category.find({},{name: true, description: true});
        res.status(200).json({
            success:true,
            message:"All Category returned successfully",
            allCategories,
        })
    }
    catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message,
        })
        
    }

}

//categoryPageDetails

exports.categoryPageDetails = async (req,res) => {

    try{
        //get CategoryId
        const {categoryId} = req.body;

        //get Courses for specified categoryId
        const selectedCategory = await Category.findById(categoryId)
                                            .populate("courses")
                                            .exec();
        //Validation
        if(!selectedCategory) {
            return res.status(404).json({
                success:false,
                message:"Data not found",
            })
        }
        //get courses for different categories
        const differentCategories = await Category.findById({
                                    _id:{$ne: categoryId}
                                })
                                .populate("courses")
                                .exec();

        //get top 10 selling courses
        //TODO ::: get top selling courses
        
        //return response
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategories,
            },
        })

    }
    catch(err) {
        console.log(err);

        return res.status(500).json({
            success:false,
            message: err.message,
        })
         
    }
}
