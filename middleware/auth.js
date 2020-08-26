const jwt = require("jsonwebtoken");
const logger = require("winston");
module.exports = (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      const error = new Error("Not Authenticated");
      error.statusCode = 401;
      req.isAuth = false;
      throw error;
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWTKEY);
    // logger.info(decodedToken);
    if (!decodedToken) {
      const error = new Error("Not authenticated");
      error.statusCode = 401;
      req.isAuth = false;
      throw error;
    }
    req.username = decodedToken.username;
    req.isAuth = true;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      req.isAuth = false;
    }
    next(err);
  }
};
