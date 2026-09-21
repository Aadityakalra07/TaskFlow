const mongoose = require("mongoose");
const request = require("supertest");

const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const app = require("../src/app");
const jobQueue = require("../src/queues/jobQueue");

const testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "password123"
};

beforeAll(async () => {
    await connectDB();
});

beforeEach(async () => {
    await User.deleteOne({
        email: testUser.email
    });
});

describe("Auth API", () => {

    test("should register a new user", async () => {

        const response = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(response.statusCode).toBe(201);

        expect(response.body.name).toBe(testUser.name);
        expect(response.body.email).toBe(testUser.email);

        expect(response.body.password).toBeUndefined();
    });


    test("should reject duplicate email", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Another User",
                email: testUser.email,
                password: "password456"
            });

        expect(response.statusCode).toBe(409);

        expect(response.body.message).toBe(
            "Email already registered"
        );
    });


    test("should login with valid credentials", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.message).toBe(
            "Login successful"
        );

        expect(response.body.token).toBeDefined();

        expect(response.body.user.email).toBe(
            testUser.email
        );

        expect(response.body.user.password).toBeUndefined();
    });


    test("should reject invalid password", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: "wrongpassword"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid credentials"
        );
    });


    test("should reject non-existent email", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "doesnotexist@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid credentials"
        );
    });


    test("should reject invalid registration data", async () => {

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "A",
                email: "invalid-email",
                password: "123"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            "Validation failed"
        );

        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
    });


    test("should reject registration without required fields", async () => {

        const response = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            "Validation failed"
        );
    });

});


afterAll(async () => {

    await User.deleteOne({
        email: testUser.email
    });

    await mongoose.connection.close();

    await jobQueue.close();
});