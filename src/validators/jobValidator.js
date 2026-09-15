const Joi = require("joi");

const createJobSchema = Joi.object({
    type: Joi.string()
        .required(),

    payload: Joi.object()
        .required(),

    priority: Joi.string()
        .valid("high", "medium", "low")
        .default("medium"),

    scheduledAt: Joi.date()
        .iso()
        .greater("now")
        .optional()
});

const updateJobSchema = Joi.object({
    type: Joi.string()
        .optional(),

    payload: Joi.object()
        .optional(),

    priority: Joi.string()
        .valid("high", "medium", "low")
        .optional(),

    scheduledAt: Joi.date()
        .iso()
        .greater("now")
        .optional()
}).min(1);

const getJobsQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),

    status: Joi.string()
        .valid(
            "pending",
            "processing",
            "completed",
            "failed",
            "cancelled"
        )
        .optional(),

    priority: Joi.string()
        .valid("high", "medium", "low")
        .optional(),

    sort: Joi.string()
        .valid(
            "createdAt",
            "-createdAt",
            "updatedAt",
            "-updatedAt"
        )
        .default("createdAt")
});

const jobIdSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required()
});

module.exports = {
    createJobSchema,
    updateJobSchema,
    getJobsQuerySchema,
    jobIdSchema
};