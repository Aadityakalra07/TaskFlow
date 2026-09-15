const validate = require("../middleware/validationMiddleware");
const {
    createJobSchema,
    updateJobSchema,
    getJobsQuerySchema,
    jobIdSchema
} = require("../validators/jobValidator");
const express = require("express");
const jobController = require("../controllers/jobController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
router.post(
    "/",
    auth,
    validate(createJobSchema),
    jobController.createJob
);
router.get(
    "/:id",
    auth,
    validate(jobIdSchema, "params"),
    jobController.getJobById
);
router.get(
    "/",
    auth,
    validate(getJobsQuerySchema, "query"),
    jobController.getAllJobs
);
router.patch(
    "/:id",
    auth,
    validate(jobIdSchema, "params"),
    validate(updateJobSchema),
    jobController.updateJob
);
router.delete("/:id",auth, validate(jobIdSchema, "params") ,jobController.deleteJob);
module.exports = router;