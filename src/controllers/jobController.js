const Job = require("../models/Job");
const jobQueue = require("../queues/jobQueue");
const createJob = async (req, res) => {
  try {
    const { type, payload, priority, scheduledAt } = req.body;

    const job = await Job.create({
      user: req.user.userId,
      type,
      payload,
      priority,
      scheduledAt,
    });

    await jobQueue.add(
      "process-job",
      {
        jobId: job._id.toString(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({
      message: "Failed to create job",
      error: err.message,
    });
  }
};
const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const priority = req.query.priority;
    const sort = req.query.sort || "createdAt";

    const filter = {
      user: req.user.userId,
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const jobs = await Job.find(filter).sort(sort).skip(skip).limit(limit);

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch jobs",
      error: err.message,
    });
  }
};
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch job",
      error: err.message,
    });
  }
};
const updateJob = async (req, res) => {
  try {
    const { type, payload, priority, scheduledAt } = req.body;

    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      {
        type,
        payload,
        priority,
        scheduledAt,
      },
      {
        new: true,
      },
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({
      message: "Failed to update job",
      error: err.message,
    });
  }
};
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete job",
      error: err.message,
    });
  }
};
const updateJobStatus = async (jobId, status, error = null) => {
  const validTransitions = {
    pending: ["processing", "cancelled"],
    processing: ["completed", "failed"],
    completed: [],
    failed: ["processing"],
    cancelled: [],
  };

  const job = await Job.findById(jobId);

  if (!job) {
    return null;
  }

  if (!validTransitions[job.status].includes(status)) {
    throw new Error(`Cannot change job status from ${job.status} to ${status}`);
  }

  job.status = status;
  job.error = error;

  await job.save();

  return job;
};
module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  updateJobStatus,
};
