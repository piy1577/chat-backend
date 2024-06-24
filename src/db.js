const mongoose = require("mongoose");

mongoose.connection.once("open", () => {
    console.log("DB Connected");
});

mongoose.connection.on("error", (err) => {
    console.log(err);
});

const uri = process.env.MONGOURL.replace(
    "<password>",
    process.env.MONGO_PASSWORD
);

const connect = async (app, PORT) => {
    try {
        await mongoose.connect(uri);
        app.listen(PORT, () => {
            console.log(`Server is running \x1b[34m http://localhost:${PORT}`);
        });
    } catch (err) {
        console.log(err);
    }
};

module.exports = connect;
