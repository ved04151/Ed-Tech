const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
const mailSender = async (email, title, body) => {

    try{
        let transporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            port:587,
            secure:false,
            auth: {
                user: process.env.Mail_USER,
                pass: process.env.Mail_PASS,
            }
        })

        let info = await transporter.sendMail({
            from: 'EduGrad || by Ved',
            to: `${email}`,
            // to: 'suh04151@gmail.com' ,
            subject:`${title}`,
            html:`${body}`,
        })

        console.log(info);
        return info;
    }
    catch(err) {
        console.log(err);
    }

}

module.exports = mailSender;