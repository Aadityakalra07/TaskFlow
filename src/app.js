const express = require('express');
const errorHandler = require("./middleware/errorMiddleware");
const {
    apiLimiter,
    authLimiter
} = require("./middleware/rateLimitMiddleware");
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();

app.use(express.json());

app.use('/api/health', apiLimiter, healthRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use((req, res, next) => {
    res.status(404).json({
        message: "Route not found"
    });
});
app.use(errorHandler);

module.exports=app;