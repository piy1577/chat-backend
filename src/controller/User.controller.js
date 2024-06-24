const User = require("../model/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;
const nodemailer = require("nodemailer");
const Chat = require("../model/Chat.model");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const login = async (req, res) => {
    const { email, password } = req.body;

    if (email === "" || password === "") {
        return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "30d" });
    res.status(200).json({
        user: { name: user.name, email: user.email },
        token,
    });
};

const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (name === "" || email === "" || password === "") {
        return res.status(400).json({ message: "All fields are required" });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    if (!user) {
        return res.status(500).json({ message: "Something went wrong" });
    }
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "30d" });

    res.status(200).json({
        user: { name: user.name, email: user.email },
        token,
    });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email || email.trim() === "") {
        return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign({ email }, secret, { expiresIn: "30m" });
    const link = `${req.protocol}://${req.headers.host}/user/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Password Reset",
        html: `<h1>Click on the link to reset your password</h1>
        <a href="${link}">Reset Password</a>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: "Something went wrong" });
        }
        res.status(200).json({
            message: "Email sent and is valide for 30 minutes",
        });
    });
};

const resetPassword = async (req, res) => {
    const token = req.query.token;
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findOne({ email: decoded.email });
        res.render("resetPassword", { name: user.name, email: user.email });
    } catch (err) {
        res.render("InvalidToken");
    }
};

const changePassword = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.findOneAndUpdate(
        { email },
        { password: hashedPassword },
        { new: true }
    );

    if (!user) {
        return res.render("Failed");
    }
    res.render("Success", { field: "Password" });
};

const updateName = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const newToken = jwt.sign({ email: user.email }, secret, {
        expiresIn: "30m",
    });
    const link = `${req.protocol}://${req.headers.host}/user/reset-name?token=${newToken}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Update Name",
        html: `<h1>Click on the link to Update your Name</h1>
        <a href="${link}">Update Name</a>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: "Something went wrong" });
        }
        res.status(200).json({
            message: "Email sent and is valide for 30 minutes",
        });
    });
};

const resetName = async (req, res) => {
    const token = req.query.token;
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findOne({ email: decoded.email });
        res.render("updateName", { email: user.email });
    } catch (err) {
        res.render("InvalidToken");
    }
};

const changeName = async (req, res) => {
    const { email, name } = req.body;
    if (!email || !name) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOneAndUpdate(
        { email },
        { name },
        { new: true }
    );

    if (!user) {
        return res.render("Failed");
    }
    res.render("Success", { field: "Name" });
};

const Me = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }
    res.status(200).json({ name: user.name, email: user.email });
};

const getContacts = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }
    const contact = user.chat.map(async (chat) => {
        const message = await Chat.findById(chat);
        if (message.users.length === 2) {
            const anotherUserId = message.users.find((u) => u !== user._id);
            const anotherUser = await User.findById(anotherUserId);
            return {
                id: message._id,
                name: anotherUser.name,
                message: message.messages[0].message,
                seen: message.seenBy.includes(user._id),
            };
        } else {
            return {
                id: message._id,
                name: message.name,
                message: message.messages[0].message,
                seen: message.seenBy.includes(user._id),
            };
        }
    });
    return res
        .status(200)
        .json(contact.length === 0 ? [] : Promise.all(contact));
};

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    updateName,
    resetName,
    changeName,
    Me,
    getContacts,
};
