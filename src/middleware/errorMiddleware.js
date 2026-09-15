const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Invalid ID"
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            message: "Duplicate value already exists"
        });
    }

    if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
    ) {
        return res.status(401).json({
            message: "Invalid or Expired Token"
        });
    }

    const statusCode = err.statusCode || 500;

    const message = err.isOperational
        ? err.message
        : "Internal Server Error";

    res.status(statusCode).json({
        message
    });
};

module.exports = errorHandler;