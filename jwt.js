const jwt = require("jsonwebtoken");

const jwtauthMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ message: "TOKEN NOT FOUND" });
  }

  //extract jwt token from req header
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  try {
    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to the req object
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({ message: "Invalid token" });
  }
};
//  Function to generate JWT token
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: 30000,
  });
};

module.exports = { jwtauthMiddleware, generateToken };
