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

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "30d" });

    res.cookie("token", token, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "strict",
    });

    res.status(200).json({
        user: { name: user.name, email: user.email },
    });
};

const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    if (!user) {
        return res.status(500).json({ message: "Something went wrong" });
    }
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "30d" });

    res.cookie("token", token, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "strict",
    });

    res.status(200).json({
        user: { id: user._id, name: user.name, email: user.email },
    });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email || email.trim() === "") {
        return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
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

const Me = async (req, res) => {
    const user = req.body.user;
    res.status(200).json({ id: user._id, name: user.name, email: user.email });
};

const getContacts = async (req, res) => {
    const user = req.body.user;
    const contact = user.chat.map(async (chat) => {
        const message = await Chat.findById(chat);
        if (message.users.length === 2) {
            const anotherUserId = message.users.find(
                (u) => u.toString() !== user._id.toString()
            );
            const anotherUser = await User.findById(anotherUserId);

            return {
                id: message._id,
                name: anotherUser.name,
                group: false,
                userId: anotherUserId,
                message:
                    message.messages.length === 0
                        ? []
                        : message.messages[0].message,
            };
        } else {
            return {
                id: message._id,
                name: message.name,
                group: true,
                message:
                    message.messages.length === 0
                        ? []
                        : message.messages[0].message,
            };
        }
    });
    return res
        .status(200)
        .json(contact.length === 0 ? [] : await Promise.all(contact));
};

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    Me,
    getContacts,
};
