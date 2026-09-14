const { Queue } = require("bullmq");

const jobQueue = new Queue("taskflow-jobs", {
    connection: {
        host: "localhost",
        port: 6379
    }
});

module.exports = jobQueue;