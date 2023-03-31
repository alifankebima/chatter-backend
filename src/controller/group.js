const { v4: uuidv4 } = require('uuid');
const googleDrive = require('../config/googleDrive');
const commonHelper = require('../helper/common');
const groupModel = require('../model/group');
const groupMemberModel = require('../model/groupMember');

const getAllGroups = async (req, res) => {
    try {
        // Search and pagination query
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'updated_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Get all groups from database
        const results = await groupModel
            .selectAllGroups(searchParam, sortBy, sort, limit, offset);

        // Return not found if there's no groups in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Group not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get all groups successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting all groups");
    }
}

const getDetailGroup = async (req, res) => {
    try {
        // Get request group id
        const id = req.params.id;

        // Get group by id from database
        const result = await groupModel.selectGroup(id);

        // Return not found if there's no group in database
        if (!result.rowCount) return commonHelper
            .response(res, null, 404, "Group not found");

        // Response
        commonHelper.response(res, result.rows, 200,
            "Get detail group successful");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting detail group");
    }
}

const createGroup = async (req, res) => {
    try {
        // Get request group data and group title
        const data = req.body;
        const id_user = req.payload.id;

        // Check if requested data exists
        if (!data.name) return commonHelper.response(res, null, 400,
            "Client must provide group name")

        // Insert group to database
        data.id = uuidv4();
        data.id_owner = id_user;
        data.created_at = new Date(Date.now()).toISOString();
        data.updated_at = data.created_at;
        const result = await groupModel.insertGroup(data);

        // Insert group owner to group member list
        const data2 = {};
        data2.id = uuidv4();
        data2.id_group = data.id;
        data2.id_user = id_user;
        data2.created_at = data.created_at;
        await groupMemberModel.insertGroupMember(data2);

        // Response
        commonHelper.response(res, result.rows, 201, "Group added");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed adding group");
    }
}

const updateGroup = async (req, res) => {
    try {
        // Get request group id and data
        const id = req.params.id;
        const id_user = req.payload.id;
        const data = req.body;

        //Check if group exists in database
        const groupResult = await groupModel.selectGroup(id);
        if (!groupResult.rowCount)
            return commonHelper.response(res, null, 404, "Group not found");

        //Check if group is created by user logged in
        if (groupResult.rows[0].id_owner != id_user)
            return commonHelper.response(res, null, 403,
                "Updating group created by other user is not allowed");

        // Update image if image already exists in database
        if (req.file && groupResult.rows[0].image != null) {
            const oldImage = groupResult.rows[0].image;
            const oldImageId = oldImage.split("=")[1];
            const updateResult = await googleDrive.updateImage(req.file, oldImageId)
            const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
            data.image = parentPath.concat(updateResult.id)

            // Upload image if image doesn't exists in database
        } else if (req.file && groupResult.rows[0].image == null) {
            const uploadResult = await googleDrive.uploadImage(req.file)
            const parentPath = process.env.GOOGLE_DRIVE_PHOTO_PATH;
            data.image = parentPath.concat(uploadResult.id)
        }

        // Update group in database
        data.id = id;
        data.updated_at = new Date(Date.now()).toISOString();
        const result = await groupModel.updateGroup(data);

        //Response
        commonHelper.response(res, result.rows, 201, "Group updated");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed updating group");
    }
}

const softDeleteGroup = async (req, res) => {
    try {
        // Get request group id
        const id = req.params.id;
        const id_user = req.payload.id;

        // Check if group exists in database
        const groupResult = await groupModel.selectGroup(id);
        if (!groupResult.rowCount)
            return commonHelper.response(res, null, 404,
                "Group not found or already deleted");

        // Check if group is created by user logged in
        if (groupResult.rows[0].id_owner != id_user)
            return commonHelper.response(res, null, 403,
                "Deleting group created by other user is not allowed");

        // Delete group
        const deleted_at = new Date(Date.now()).toISOString();
        const result = await groupModel.softDeleteGroup(id, deleted_at);

        // Response
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
    softDeleteGroup
}