const Job = require("../models/Job");
const jobQueue = require("../queues/jobQueue");
const AppError = require("../utils/AppError");
const { getCache, setCache, deleteUserJobCache } = require("../utils/cache");

const createJob = async (req, res ,next) => {
  try {
    const { type, payload, priority, scheduledAt } = req.body;

    const job = await Job.create({
      user: req.user.userId,
      type,
      payload,
      priority,
      scheduledAt,
    });

    const priorityMap = {
      high: 1,
      medium: 5,
      low: 10,
    };

    const bullmqPriority = priorityMap[priority] || 5;

    const delay = scheduledAt
      ? Math.max(0, new Date(scheduledAt).getTime() - Date.now())
      : 0;

    await jobQueue.add(
      "process-job",
      {
        jobId: job._id.toString(),
      },
      {
        priority: bullmqPriority,
        delay: delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );
    await deleteUserJobCache(req.user.userId);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

const getAllJobs = async (req, res, next) => {
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

    // Create a unique cache key for this exact query
    const cacheKey = `jobs:${req.user.userId}:${page}:${limit}:${status || "all"}:${priority || "all"}:${sort}`;

    // Check Redis first
    const cachedJobs = await getCache(cacheKey);

    if (cachedJobs) {
      return res.status(200).json(cachedJobs);
    }

    // Cache miss → query MongoDB
    const jobs = await Job.find(filter).sort(sort).skip(skip).limit(limit);

    // Store MongoDB result in Redis
    await setCache(cacheKey, jobs);

    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

   if (!job) {
    throw new AppError("Job not found", 404);
}

    res.status(200).json(job);
  } catch (err) {
    next(err);
}
};

const updateJob = async (req, res,next) => {
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
    throw new AppError("Job not found", 404);
}
    await deleteUserJobCache(req.user.userId);
    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!job) {
    throw new AppError("Job not found", 404);
}
    await deleteUserJobCache(req.user.userId);
    res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (err) {
    next(err);
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
