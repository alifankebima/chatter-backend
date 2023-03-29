const { v4: uuidv4 } = require('uuid');
const googleDrive = require('../config/googleDrive');
const commonHelper = require('../helper/common');
const authHelper = require("../helper/auth");
const email = require('../config/mail');
const userModel = require('../model/user');

const registerUser = async (req, res) => {
    try {
        // Get request user data
        let data = req.body;

        // Check if email is already used
        const emailResult = await userModel.findEmail(data.email);
        if (emailResult.rowCount) return commonHelper
            .response(res, null, 403, "Email is already used");

        // Check if username is already used
        const usernameResult = await userModel.findUsername(data.username);
        if (usernameResult.rowCount) return commonHelper
            .response(res, null, 403, "Username is already used");

        // Insert user to database
        data.id = uuidv4();
        data.email = data.email.toLowerCase();
        const salt = bcrypt.genSaltSync(10);
        data.password = bcrypt.hashSync(data.password, salt);
        data.created_at = new Date(Date.now()).toISOString();
        const result = await userModel.insertUser(data);

        // Send email verification link
        const payload = {
            email: data.email
        }
        const token = authHelper.generateToken(payload);
        email.sendMail(token, req.body.email);

        // Response
        commonHelper.response(res, result.rows, 201,
            "Register successful, please check your email");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed registering user");
    }
}

const resendVerificationEmail = async (req, res) => {
    try {
        // Get request email
        const email = req.body.email;

        // Check if email is already verified
        const emailResult = await userModel.findEmailVerified(email);
        if (emailResult.rowCount) return commonHelper
            .response(res, null, 403, "Email is already verified");

        // Resend email verification link
        const payload = {
            email: data.email
        }
        const token = authHelper.generateToken(payload);
        email.sendMail(token, req.body.email);

        // Response
        commonHelper.response(res, result.rows, 200,
            "Verification link has been sent, please check your email");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed sending verification email");
    }
}

const verifyUserEmail = async (req, res) => {
    try {
        // Get request token
        let token = req.body.token;

        // Decode token
        let decoded = jwt.verify(token, process.env.JWT_SECRETKEY);

        // Check if email is already verified
        const emailResult = await userModel.findEmailVerified(decoded.email);
        if (emailResult.rowCount) return commonHelper
            .response(res, null, 403, "Email is already verified");

        // Verify email
        const result = await userModel.verifyEmail(decoded.email);

        // Response
        commonHelper.response(res, result.rows, 200,
            "Email verification successful");
    } catch (error) {
        console.log(error);
        switch (error.name) {
            case "JsonWebTokenError":
                commonHelper.response(res, null, 401, "Verification link invalid");
                break;
            case "TokenExpiredError":
                commonHelper.response(res, null, 401, "Verification link expired");
                break;
            default:
                commonHelper.response(res, null, 500, "Verification link error");
                break;
        }
    }
}

const LoginUser = async (req, res) => {
    try {
        // Get request login information
        const data = req.body;

        // Check if email is already used
        const { rows: [user] } = await userModel.findEmail(data.email);
        if (!user) return commonHelper
            .response(res, null, 403, "Email is invalid");

        // Check if password is valid
        const isValidPassword = bcrypt.compareSync(data.password, user.password);
        if (!isValidPassword) return res.json({ Message: "Password is invalid" });

        // Check if user's email is verified
        if (!user.email_verified) return commonHelper
            .response(res, null, 403, "Email is not verified");

        // Generate payload
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username
        }
        user.token = authHelper.generateToken(payload);
        user.refreshToken = authHelper.generateRefreshToken(payload);

        // Response
        delete user.password;
        commonHelper.response(res, user, 200, "Login is successful");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed login user");
    }
}

const getAllUsers = async (req, res) => {
    try {
        // Search and pagination query
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'updated_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Get all users from database
        const results = await userModel
            .selectAllUsers(searchParam, sortBy, sort, limit, offset);

        // Return not found if there's no user in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Users not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get all users successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting all users");
    }
}

const getDetailUser = async (req, res) => {
    try {
        // Get request user id
        const id = req.params.id;

        // Get user by id from database
        const result = await userModel.selectUser(id);

        // Return not found if there's no user in database
        if (!result.rowCount) return commonHelper
            .response(res, null, 404, "User not found");

        // Response
        commonHelper.response(res, result.rows, 200,
            "Get detail user successful");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting detail user");
    }
}

const updateUser = async (req, res) => {
    try {
        // Get request user id and user data
        const id_user = req.payload.id;
        const data = req.body;

        const oldUserResult = await userModel.selectUser(id_user);

        if (oldUserResult.rowCount) return commonHelper
            .response(res, null, 404, "User not found");

        // Update image if image already exists in database
        if (req.file && oldUserResult.rows[0].image != null) {
            const oldImage = oldUserResult.rows[0].image;
            const oldImageId = oldImage.split("=")[1];
            const updateResult = await googleDrive.updateImage(req.file, oldImageId)
            const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
            data.image = parentPath.concat(updateResult.id)

            // Upload image if image doesn't exists in database
        } else if (req.file && oldUserResult.rows[0].image == null) {
            const uploadResult = await googleDrive.uploadImage(req.file)
            const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
            data.image = parentPath.concat(uploadResult.id)
        }

        // Hash password if updated
        if (data.password) {
            const salt = bcrypt.genSaltSync(10);
            data.password = bcrypt.hashSync(data.password, salt);
        }

        // Update user in database
        data.id = id_user;
        data.updated_at = new Date(Date.now()).toISOString();
        const result = await userModel.updateUser(data);

        // Response
        commonHelper.response(res, result.rows, 201, "User updated");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed updating user");
    }
}

const deleteUser = async (req, res) => {
    try {
        // Get request user id
        const id_user = req.payload.id;

        // Check if user exists in database
        const userResult = await userModel.selectUser(id_user);
        if (!userResult.rowCount) return commonHelper
            .response(res, null, 404, "User not found");

        // Delete user
        const result = await userModel.deleteUser(id_user);

        // Delete user's image
        const oldPhoto = userResult.rows[0].image;
        const oldPhotoId = oldPhoto.split("=")[1];
        await googleDrive.deletePhoto(oldPhotoId);

        // Response
        commonHelper.response(res, result.rows, 200, "User deleted");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed deleting user");
    }
}

module.exports = {
    registerUser,
    resendVerificationEmail,
    verifyUserEmail,
    LoginUser,
    getAllUsers,
    getDetailUser,
    updateUser,
    deleteUser
}