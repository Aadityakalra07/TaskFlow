const validate = (schema, source = "body") => {
    return (req, res, next) => {

        const { error, value } = schema.validate(req[source], {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.details.map((detail) => detail.message)
            });
        }

        if (source === "query") {
            Object.defineProperty(req, "query", {
                ...Object.getOwnPropertyDescriptor(req, "query"),
                value: value
            });
        } else {
            req[source] = value;
        }

        next();
    };
};

module.exports = validate;