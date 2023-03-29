const { v4: uuidv4 } = require('uuid');
const { uploadPhoto, updatePhoto, deletePhoto } = require('../config/googleDrive.config.js');

const commonHelper = require('../helper/common.js');
const userModel = require('../model/user.js');


const getAllUsers = async (req, res) => {
    try {
        //Search and pagination query
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'updated_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 6;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        //Get all users from database
        const results = await userModel
            .selectAllUsers(searchParam, sortBy, sort, limit, offset);

        //Return not found if there's no user in database
        if (!results.rows[0]) return commonHelper
            .response(res, null, 404, "Users not found");

        //Pagination info
        const { rows: [count] } = await userModel.countData();
        const totalData = Number(count.count);
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        //Return if page params more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        //Response
        commonHelper.response(res, results.rows, 200,
            "Get all users successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting users");
    }
}

const getDetailUser = async (req, res) => {
    try {
        //Get request user id
        const id = req.params.id;

        //Get user by id from database
        const result = await userModel.selectUser(id);

        //Return not found if there's no user in database
        if (!result.rowCount) return commonHelper
            .response(res, null, 404, "User not found");

        //Get user videos from database
        const resultVideos = await videoModel.selectUserVideos(id);
        result.rows[0].videos = resultVideos.rows;

        //Get user comments from database
        const resultComments = await commentModel.selectUserComments(id);
        result.rows[0].comments = resultComments.rows;

        //Response
        //Both user videos and comments will return empty array
        //If there's no user videos or comments in database
        commonHelper.response(res, result.rows, 200,
            "Get detail user successful");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting detail user");
    }
}

const createUser = async (req, res) => {
    try {
        //Get request user data and user title
        const data = req.body;
        const title = data.title;

        //Check if user title already exists
        const userTitleResult = await userModel.selectUserTitle(title);
        if (userTitleResult.rowCount > 0) return commonHelper
            .response(res, null, 403, "User title already exists");

        //Get user photo
        if (req.file == undefined) return commonHelper
            .response(res, null, 400, "Please input photo");
        // const HOST = process.env.RAILWAY_STATIC_URL;
        // data.photo = `http://${HOST}/img/${req.file.filename}`;
        const uploadResult = await uploadPhoto(req.file)
        const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
        data.photo = parentPath.concat(uploadResult.id)

        //Insert user to database
        data.id = uuidv4();
        data.id_user = req.payload.id;
        data.created_at = Date.now();
        data.updated_at = Date.now();
        const result = await userModel.insertUser(data);

        //Response
        commonHelper.response(res, [{ id: data.id }], 201, "User added");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed adding user");
    }
}

const updateUser = async (req, res) => {
    try {
        //Get request user id, user id, and user data
        const id = req.params.id;
        const id_user = req.payload.id;
        const data = req.body;

        //Check if user exists in database
        const userResult = await userModel.selectUser(id);
        if (!userResult.rowCount)
            return commonHelper.response(res, null, 404, "User not found");

        //Check if user is created by user logged in
        if (userResult.rows[0].id_user != id_user)
            return commonHelper.response(res, null, 403,
                "Updating user created by other user is not allowed");


        try {
            const oldPhoto = userResult.rows[0].photo;
            const oldPhotoId = oldPhoto.split("=")[1];
            const updateResult = await updatePhoto(req.file, oldPhotoId)
            const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
            data.photo = parentPath.concat(updateResult.id)
        }
        catch (err) {
            data.photo = userResult.rows[0].photo
        }
        //Get user photo
        // if (req.file == undefined) return commonHelper
        //     .response(res, null, 400, "Please input photo");

        //Update user in database
        data.id = id;
        data.updated_at = Date.now();
        const result = await userModel.updateUser(data);

        //Response
        commonHelper.response(res, [{ id: data.id }], 201, "User updated");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed updating user");
    }
}

const deleteUser = async (req, res) => {
    try {
        //Get request user id
        const id = req.params.id;
        const id_user = req.payload.id;

        //Check if user exists in database
        const userResult = await userModel.selectUser(id);
        if (!userResult.rowCount)
            return commonHelper.response(res, null, 404,
                "User not found or already deleted");

        //Check if user is created by user logged in
        if (userResult.rows[0].id_user != id_user)
            return commonHelper.response(res, null, 403,
                "Deleting user created by other user is not allowed");

        
        //Delete user
        const result = await userModel.deleteUser(id);

        const oldPhoto = userResult.rows[0].photo;
        const oldPhotoId = oldPhoto.split("=")[1];
        await deletePhoto(oldPhotoId)

        //Response
        commonHelper.response(res, result.rows, 200, "User deleted");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed deleting user");
    }
}

module.exports = {
    getAllUsers,
    getDetailUser,
    createUser,
    updateUser,
    deleteUser
}