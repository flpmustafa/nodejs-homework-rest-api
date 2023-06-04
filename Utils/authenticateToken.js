const jwt = require('jsonwebtoken');
const User = require('../models/users');

const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer") {
    return next(Error("Unauthorized"));
  }

  try {
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);
    if (!user) {
      return next(Error("Unauthorized"));
    }
    req.user = user;    
    next();
  } catch {
    next(Error("Unauthorized"));
  }
};


module.exports = authenticate;
