const jwt = require("jsonwebtoken");
const User = require("../model/User.model");

const verifyUser = async (req, res, next) => {
    let token = req.cookies.token;
    if (!token) {
        return res.status(400).json({
            status: "Error",
            message: "Token not provided",
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({
            message: "You are not logged in",
        });
    }
    req.body.user = user;
    next();
};

export default verifyUser;
