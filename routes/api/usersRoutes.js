const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../../models/users");
const router = express.Router();
const { HttpError } = require("../../helpers/httpErrors");
const authenticate = require("../../Utils/authenticateToken");


router.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
      
        if (user) {
          throw new HttpError(409, "Email in use");
        }
              const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ ...req.body, password: hashedPassword });
      
        res.status(201).json({
          email: newUser.email,
          subscription: newUser.subscription,
        });
    } catch (error) {
      return next(error);
    }
  });
  router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
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

module.exports = router;