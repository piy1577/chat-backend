const dotenv = require("dotenv");
dotenv.config({ path: "./src/config/.env.test" });
const request = require("supertest");
const app = require("../app");
const http = require("http");
const mongoose = require("mongoose");
const uri = process.env.MONGOURL.replace(
    "<password>",
    process.env.MONGO_PASSWORD
);
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

beforeAll(async () => {
    await mongoose.connect(uri);
    await new Promise((resolve) => server.listen(PORT, resolve));
    await request(app).post("/user/register").send({
        email: "test2@gmail.com",
        name: "test2",
        password: "test2",
    });
    await request(app).post("/user/register").send({
        email: "test3@gmail.com",
        name: "test3",
        password: "test3",
    });
});

afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    await new Promise((resolve) => server.close(resolve));
});
var token = "";

describe("User Route", () => {
    describe("POST Register", () => {
        it("should throw error if email is not provided", async () => {
            const res = await request(app)
                .post("/user/register")
                .send({ name: "test", password: "test" });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should throw error if name is not provided", async () => {
            const res = await request(app)
                .post("/user/register")
                .send({ email: "test@gmail.com", password: "test" });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should throw error if password is not provided", async () => {
            const res = await request(app)
                .post("/user/register")
                .send({ email: "test@gmail.com", name: "test" });
            expect(res.statusCode).toEqual(400);
        });

        it("should register user if all fields are provided", async () => {
            const res = await request(app).post("/user/register").send({
                email: "test@gmail.com",
                name: "test",
                password: "test",
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("token");
            token = res.body.token;
        });

        it("should throw error if email already exists", async () => {
            const res = await request(app).post("/user/register").send({
                email: "test@gmail.com",
                name: "test",
                password: "test",
            });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
        });
    });

    describe("POST Login", () => {
        it("should throw error if email is not provided", async () => {
            const res = await request(app).post("/user/login");
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/required/i);
        });

        it("should throw error if password is not provided", async () => {
            const res = await request(app)
                .post("/user/login")
                .send({ email: "test@gmail.com" });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/required/i);
        });

        it("should throw error if user not found", async () => {
            const res = await request(app).post("/user/login").send({
                email: "test10@gmail.com",
                password: "test",
            });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/user/i);
        });

        it("should throw error if password is invalid", async () => {
            const res = await request(app).post("/user/login").send({
                email: "test@gmail.com",
                password: "test1",
            });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should login user if email and password are correct", async () => {
            const res = await request(app).post("/user/login").send({
                email: "test@gmail.com",
                password: "test",
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("token");
        });
    });

    describe("GET Me", () => {
        it("should throw error if token is not provided", async () => {
            const res = await request(app).get("/user/");
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("message");
        });

        it("should return user if token is provided", async () => {
            const res = await request(app)
                .get("/user/")
                .set("Authorization", `Bearer ${token}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("id");
            expect(res.body).toHaveProperty("name");
            expect(res.body).toHaveProperty("email");
        });
    });

    describe("forgot Password", () => {
        it("should throw error if email is not provided", async () => {
            const res = await request(app).put("/user/forgotPassword");
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/required/i);
        });

        it("should throw error if user is not found", async () => {
            const res = await request(app)
                .put("/user/forgotPassword")
                .send({ email: "test10@gmail.com" });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/user/i);
        });
    });
});

describe("Chat router", () => {
    describe("POST create chat", () => {
        it("should throw error if token is not provided", async () => {
            const res = await request(app).post("/chat");
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message");
        });
        it("should throw error if email is not provided", async () => {
            const res = await request(app)
                .post("/chat")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });
        it("should throw error if email is not found", async () => {
            const res = await request(app)
                .post("/chat")
                .set("Authorization", `Bearer ${token}`)
                .send({ email: "test10@gmail.com" });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });
        it("should create chat if email is provided", async () => {
            const res = await request(app)
                .post("/chat")
                .set("Authorization", `Bearer ${token}`)
                .send({ email: "test3@gmail.com" });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
        });
        it("should throw error if chat is already created", async () => {
            const res = await request(app)
                .post("/chat")
                .set("Authorization", `Bearer ${token}`)
                .send({ email: "test3@gmail.com" });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });
    });
    describe("POST create group", () => {
        it("should throw error if token is not provided", async () => {
            const res = await request(app).post("/chat/group");
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message");
        });

        it("should throw error if name is not provided", async () => {
            const res = await request(app)
                .post("/chat/group")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should throw error if emails are not provided", async () => {
            const res = await request(app)
                .post("/chat/group")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "group" });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should throw error if emails are not found", async () => {
            const res = await request(app)
                .post("/chat/group")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "group",
                    emails: ["test20@gmail.com", "test30@gmail.com"],
                });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should throw error if user only gives his email", async () => {
            const res = await request(app)
                .post("/chat/group")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "group",
                    emails: ["test@gmail.com"],
                });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
        });

        it("should create group if emails are provided", async () => {
            const res = await request(app)
                .post("/chat/group")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "group",
                    emails: ["test2@gmail.com", "test3@gmail.com"],
                });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
        });
    });
    describe("Get contacts", () => {
        it("should throw error if token is not provided", async () => {
            const res = await request(app).get("/user/getContacts");
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message");
        });
        it("should return contacts if token is provided", async () => {
            const res = await request(app)
                .get("/user/getContacts")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
        });
    });

    // describe("Socket connect");
    // describe("Socket disconnect");
    // describe("Socket sendMessage");
    // describe("Socket getMessage");
});
