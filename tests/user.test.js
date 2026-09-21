const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const connectDB = require("../src/config/db");
const app = require("../src/app");
const User = require("../src/models/User");
const jobQueue = require("../src/queues/jobQueue");

beforeAll(async () => {
    await connectDB();
});

describe("User Authorization", () => {

    test("should reject deleting a user without authentication", async () => {

        const response = await request(app)
            .delete("/api/users/507f1f77bcf86cd799439011");

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe("Unauthorized");
    });


    test("should reject deleting a user with an invalid token", async () => {

        const response = await request(app)
            .delete("/api/users/507f1f77bcf86cd799439011")
            .set("Authorization", "Bearer invalidtoken");

        expect(response.statusCode).toBe(401);

        expect(response.body.message).toBe(
            "Invalid or Expired Token"
        );
    });


    test("should reject deleting a user when token belongs to non-admin", async () => {

        const token = jwt.sign(
            {
                userId: new mongoose.Types.ObjectId().toString(),
                role: "user"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        const response = await request(app)
            .delete("/api/users/507f1f77bcf86cd799439011")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(403);

        expect(response.body.message).toBe("Forbidden");
    });


    test("should allow admin to delete a user", async () => {

        // Create a real user in the test database
        const user = await User.create({
            name: "Admin Test User",
            email: "admintest@example.com",
            password: "password123"
        });

        // Create an admin JWT
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Delete the user using admin token
        const response = await request(app)
            .delete(`/api/users/${user._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        // Confirm user was actually deleted
        const deletedUser = await User.findById(user._id);

        expect(deletedUser).toBeNull();
    });

});


afterAll(async () => {

    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Close BullMQ connection
    await jobQueue.close();
});