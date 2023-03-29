const { v4: uuidv4 } = require('uuid');
const { uploadPhoto, updatePhoto, deletePhoto } = require('../config/googleDrive.config.js');

const commonHelper = require('../helper/common.js');
const groupModel = require('../model/group.js');


const getAllGroups = async (req, res) => {
    try {
        //Search and pagination query
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'updated_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 6;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        //Get all groups from database
        const results = await groupModel
            .selectAllGroups(searchParam, sortBy, sort, limit, offset);

        //Return not found if there's no group in database
        if (!results.rows[0]) return commonHelper
            .response(res, null, 404, "Groups not found");

        //Pagination info
        const { rows: [count] } = await groupModel.countData();
        const totalData = Number(count.count);
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        //Return if page params more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        //Response
        commonHelper.response(res, results.rows, 200,
            "Get all groups successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting groups");
    }
}

const getDetailGroup = async (req, res) => {
    try {
        //Get request group id
        const id = req.params.id;

        //Get group by id from database
        const result = await groupModel.selectGroup(id);

        //Return not found if there's no group in database
        if (!result.rowCount) return commonHelper
            .response(res, null, 404, "Group not found");

        //Get group videos from database
        const resultVideos = await videoModel.selectGroupVideos(id);
        result.rows[0].videos = resultVideos.rows;

        //Get group comments from database
        const resultComments = await commentModel.selectGroupComments(id);
        result.rows[0].comments = resultComments.rows;

        //Response
        //Both group videos and comments will return empty array
        //If there's no group videos or comments in database
        commonHelper.response(res, result.rows, 200,
            "Get detail group successful");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting detail group");
    }
}

const createGroup = async (req, res) => {
    try {
        //Get request group data and group title
        const data = req.body;
        const title = data.title;

        //Check if group title already exists
        const groupTitleResult = await groupModel.selectGroupTitle(title);
        if (groupTitleResult.rowCount > 0) return commonHelper
            .response(res, null, 403, "Group title already exists");

        //Get group photo
        if (req.file == undefined) return commonHelper
            .response(res, null, 400, "Please input photo");
        // const HOST = process.env.RAILWAY_STATIC_URL;
        // data.photo = `http://${HOST}/img/${req.file.filename}`;
        const uploadResult = await uploadPhoto(req.file)
        const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
        data.photo = parentPath.concat(uploadResult.id)

        //Insert group to database
        data.id = uuidv4();
        data.id_group = req.payload.id;
        data.created_at = Date.now();
        data.updated_at = Date.now();
        const result = await groupModel.insertGroup(data);

        //Response
        commonHelper.response(res, [{ id: data.id }], 201, "Group added");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed adding group");
    }
}

const updateGroup = async (req, res) => {
    try {
        //Get request group id, group id, and group data
        const id = req.params.id;
        const id_group = req.payload.id;
        const data = req.body;

        //Check if group exists in database
        const groupResult = await groupModel.selectGroup(id);
        if (!groupResult.rowCount)
            return commonHelper.response(res, null, 404, "Group not found");

        //Check if group is created by group logged in
        if (groupResult.rows[0].id_group != id_group)
            return commonHelper.response(res, null, 403,
                "Updating group created by other group is not allowed");


        try {
            const oldPhoto = groupResult.rows[0].photo;
            const oldPhotoId = oldPhoto.split("=")[1];
            const updateResult = await updatePhoto(req.file, oldPhotoId)
            const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
            data.photo = parentPath.concat(updateResult.id)
        }
        catch (err) {
            data.photo = groupResult.rows[0].photo
        }
        //Get group photo
        // if (req.file == undefined) return commonHelper
        //     .response(res, null, 400, "Please input photo");

        //Update group in database
        data.id = id;
        data.updated_at = Date.now();
        const result = await groupModel.updateGroup(data);

        //Response
        commonHelper.response(res, [{ id: data.id }], 201, "Group updated");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed updating group");
    }
}

const deleteGroup = async (req, res) => {
    try {
        //Get request group id
        const id = req.params.id;
        const id_group = req.payload.id;

        //Check if group exists in database
        const groupResult = await groupModel.selectGroup(id);
        if (!groupResult.rowCount)
            return commonHelper.response(res, null, 404,
                "Group not found or already deleted");

        //Check if group is created by group logged in
        if (groupResult.rows[0].id_group != id_group)
            return commonHelper.response(res, null, 403,
                "Deleting group created by other group is not allowed");

        
        //Delete group
        const result = await groupModel.deleteGroup(id);

        const oldPhoto = groupResult.rows[0].photo;
        const oldPhotoId = oldPhoto.split("=")[1];
        await deletePhoto(oldPhotoId)

        //Response
        commonHelper.response(res, result.rows, 200, "Group deleted");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed deleting group");
    }
}

module.exports = {
    getAllGroups,
    getDetailGroup,
    createGroup,
    updateGroup,
    deleteGroup
}