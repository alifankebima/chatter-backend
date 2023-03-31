const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const commonHelper = require("../helper/common")

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization.split(" ")[1];
            let decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
            req.payload = decoded;
            next();
        } else {
            return commonHelper.response(res, null, 401, "Unauthorized, please provide valid token")
        }
    } catch (error) {
        if (error && error.name === "JsonWebTokenError") {
            return next(new createError(401, "Token invalid"));
        } else if (error && error.name === "TokenExpiredError") {
            return next(new createError(401, "Token expired"));
        } else {
            return next(new createError(401, "Token not active"));
        }
    }
};

module.exports = { protect };