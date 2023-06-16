const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jimp = require("jimp");
const fs = require('fs');
const { nanoid } = require("nanoid");
const User = require("../../models/users");
const router = express.Router();
const { HttpError } = require("../../helpers/httpErrors");
const authenticate = require("../../Utils/authenticateToken");
const sendEmail = require("../../helpers/sendEmail");
const userEmailSchema = require('../../Utils/validation');
const gravatar = require('gravatar');

const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

router.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }); 
      
        if (user) {
          throw new HttpError(409, "Email in use");
        }
              const hashedPassword = await bcrypt.hash(password, 10);
              const verificationCode = nanoid();

              const avatarURL = gravatar.url(email, { s: '200', r: 'pg', d: 'mm' });
          
              const newUser = await User.create({ ...req.body, password: hashedPassword, avatarURL, verificationCode});
              const { PROJECT_URL } = process.env;
              
              const verifyEmail = {
                to: email,
                subject: "Verify email",
                html: `<a target="_blank" href="${PROJECT_URL}/api/users/verify/${verificationCode}">Click to verify</a>`
              }


              await sendEmail(verifyEmail);
      
        res.status(201).json({
          email: newUser.email,
          subscription: newUser.subscription,
        });
    } catch (error) {
      return next(error);
    }
  });



router.get("/verify/:verificationCode", async (req, res, next) => {
   const { verificationCode } = req.params;
   const user = await User.findOne({ verificationCode });
  try {
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndUpdate(user._id, {verify: true, verificationCode: ""})
    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  const { email } = req.body;

  try {
    await userEmailSchema.validateAsync({ email });

    const user = await User.findOne({ email });

    if (!user) {
      throw new HttpError(404);
    }

    if (user.verify) {
      throw new HttpError(400, "Email already verified");
    }

    const { PROJECT_URL } = process.env;
    const verifyEmail = {
      to: email,
      subject: "Verify email",
      html: `<a target="_blank" href="${PROJECT_URL}/api/users/verify/${user.verificationCode}">Click to verify</a>`
    }

    await sendEmail(verifyEmail);
    res.status(201).json({ message: "Verify Email Sent" });

  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    
    try {
      const user = await User.findOne({ email });
  
      if (!user || user.verify) {
        throw new HttpError(401, "Email or password is wrong");
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new HttpError(401, "Email or password is wrong");
      }
      const payload = {
        id: user._id,
      };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "23h" });
        await User.findByIdAndUpdate(user._id, { token });
    
      res.status(200).json({
        token,
        user: {
          email: user.email,
          subscription: user.subscription,
        },
      });
    } catch (error) {
      next(error);
    }
  });

router.get("/current", authenticate, async (req, res, next) => {
    const { email, subscription } = req.user;
    try {
    res.status(200).json({
      email,
      subscription,
    });
     } catch (error) {
    next(error);
  }
})

router.post("/logout", authenticate, async (req, res, next) => {
    const { _id } = req.user;
    try {
    await User.findByIdAndUpdate(_id, { token: '' });
    res.status(204).json({
          message: "No Content",
        });
    } catch (error) {
        next(error);
}});

router.patch("/avatars", authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    const { path: tempPath, originalname } = req.file;
    const { _id } = req.user;
    const uniqueFileName = `${_id}-${originalname}`; 
    const imagePath = `public/avatars/${uniqueFileName}`; 

    
    const image = await jimp.read(tempPath);
    await image.resize(250, 250).write(imagePath);

   
    fs.unlink(tempPath, (err) => {
      if (err) {
        console.error(err);
      }
    });

    
    await User.findByIdAndUpdate(_id, { avatarURL: `/avatars/${uniqueFileName}` });

    res.status(200).json({ avatarURL: `/avatars/${uniqueFileName}` });
  } catch (error) {
    next(error);
  }
});


module.exports = router;