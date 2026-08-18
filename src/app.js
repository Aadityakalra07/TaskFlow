const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
module.exports=app;