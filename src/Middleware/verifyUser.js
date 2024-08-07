const jwt = require("jsonwebtoken");
const User = require("../model/User.model");

const verifyUser = async (req, res, next) => {
    let token = req.cookies.token;
    if (!token) {
        return res.status(400).json({
            message: "Token not provided",
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                message: "You are not logged in",
            });
        }
        req.body.user = user;
        next();
    } catch (err) {
        res.status(400).json(err);
    }
};

module.exports = verifyUser;
