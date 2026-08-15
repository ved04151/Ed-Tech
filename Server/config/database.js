const mongoose = require("mongoose")
require("dotenv").config();

exports.dbConnect = () => {
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("MongoDB Connected..."))
    .catch((err) =>{
        console.log("DB Connection Failed");
        console.log(err);
        process.exit(1);
    })
}