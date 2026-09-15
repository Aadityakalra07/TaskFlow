require("dotenv").config();

const { createClient } = require("redis");
const { Worker } = require("bullmq");
const Job = require("../models/Job");
const connectDB = require("../config/db");

const startWorker = async () => {
    try {
        // Connect worker to MongoDB
        await connectDB();

        // Create Redis publisher
        const publisher = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379"
        });

        publisher.on("error", (err) => {
            console.error("Redis Publisher Error:", err);
        });

        // Connect Redis publisher
        await publisher.connect();

        console.log("Redis publisher connected");

        const jobWorker = new Worker(
            "taskflow-jobs",

            async (job) => {
                console.log("Processing job:", job.data.jobId);

                // Mark job as processing and increment attempts
                const dbJob = await Job.findByIdAndUpdate(
                    job.data.jobId,
                    {
                        status: "processing",
                        $inc: { attempts: 1 }
                    },
                    {
                        returnDocument: "after"
                    }
                );

                if (!dbJob) {
                    throw new Error("Job not found");
                }

                // Publish processing update
                await publisher.publish(
                    "job-updates",
                    JSON.stringify({
                        jobId: dbJob._id.toString(),
                        status: "processing"
                    })
                );

                try {
                    // Handle different job types
                    if (dbJob.type === "SEND_EMAIL") {

                        console.log(
                            "Sending email to:",
                            dbJob.payload.to
                        );

                        console.log(
                            "Subject:",
                            dbJob.payload.subject
                        );

                        // Simulate email processing
                        await new Promise((resolve) => {
                            setTimeout(resolve, 2000);
                        });

                        console.log("Email sent successfully");

                    } else {

                        throw new Error(
                            `Unsupported job type: ${dbJob.type}`
                        );
                    }

                    // Mark job as completed
                    await Job.findByIdAndUpdate(
                        job.data.jobId,
                        {
                            status: "completed"
                        }
                    );

                    // Publish completed update
                    await publisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId: dbJob._id.toString(),
                            status: "completed"
                        })
                    );

                } catch (err) {

                    // Mark job as failed in MongoDB
                    await Job.findByIdAndUpdate(
                        job.data.jobId,
                        {
                            status: "failed",
                            error: err.message
                        }
                    );

                    // Publish failed update
                    await publisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId: dbJob._id.toString(),
                            status: "failed",
                            error: err.message
                        })
                    );

                    // Tell BullMQ that the job failed
                    throw err;
                }
            },

            {
                connection: {
                    host: "localhost",
                    port: 6379,
                    maxRetriesPerRequest: null
                }
            }
        );

        jobWorker.on("completed", (job) => {
            console.log("Job completed:", job.id);
        });

        jobWorker.on("failed", (job, err) => {
            console.log(
                "Job failed:",
                job.id,
                err.message
            );
        });

        console.log("Worker is running");

    } catch (err) {
        console.error(
            "Failed to start worker:",
            err
        );
    }
};

startWorker();