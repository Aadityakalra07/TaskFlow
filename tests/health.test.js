const request = require("supertest");
const app = require("../src/app");
const jobQueue = require("../src/queues/jobQueue");
describe("Health API", () => {

    test("should return API health status", async () => {

        const response = await request(app)
            .get("/api/health");

        expect(response.statusCode).toBe(200);
    });

});

afterAll(async () => {
    await jobQueue.close();
});