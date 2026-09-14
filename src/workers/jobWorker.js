const { Worker } = require("bullmq");
const Job = require("../models/Job");
const connectDB = require("../config/db");
require("dotenv").config();
const startWorker = async () => {
    try {
        // Connect worker to MongoDB
        await connectDB();

        const jobWorker = new Worker(
            "taskflow-jobs",

            async (job) => {
                console.log("Processing job:", job.data.jobId);

                // Find the job and mark it as processing
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

                } catch (err) {

                    // Mark job as failed in MongoDB
                    await Job.findByIdAndUpdate(
                        job.data.jobId,
                        {
                            status: "failed",
                            error: err.message
                        }
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
        console.error("Failed to start worker:", err);
    }
};

startWorker();