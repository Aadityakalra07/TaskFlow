const express = require("express");
const jobController = require("../controllers/jobController");
const router = express.Router();
router.post("/", jobController.createJob);
router.get("/:id", jobController.getJobById);
router.get("/", jobController.getAllJobs);
router.patch("/:id", jobController.updateJob);
router.delete("/:id", jobController.deleteJob);
module.exports = router;