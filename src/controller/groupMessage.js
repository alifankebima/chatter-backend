const { v4: uuidv4 } = require('uuid');
const commonHelper = require('../helper/common');
const groupModel = require('../model/group');
const groupMessageModel = require('../model/groupMessage');

const getAllGroupMessages = async (req, res) => {
    try {
        // Search and pagination query
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'created_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Get all group messages from database
        const results = await groupMessageModel
            .selectAllGroupMessages(searchParam, sortBy, sort, limit, offset);

        // Return not found if there's no group messages in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Group message not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get all group messages successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting all group messages");
    }
}

const getGroupMessages = async (req, res) => {
    try {
        // Search and pagination query
        const id_group = req.params.id_group;
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'created_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Get group messages from database
        const results = await groupMessageModel.selectGroupMessages(id_group,
            searchParam, sortBy, sort, limit, offset);

        // Return not found if there's no group messages in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Group message not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get group messages successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting group messages");
    }
}

const createGroupMessage = async (req, res) => {
    try {
        // Get request group data and group title
        const id_group = req.params.id_group;
        const data = req.body;
        const id_user = req.payload.id;

        // Check if requested data exists
        if (!id_group || !data.message) return commonHelper
            .response(res, null, 400, "User must provide id group and message");

        // Check if group exists in database
        const groupResult = await groupModel.findId(id_group);
        if (!groupResult.rowCount) return commonHelper.response(res, null, 404,
            "Group not found");

        // Insert group message to database
        data.id = uuidv4();
        data.id_group = id_group;
        data.sender = id_user;
        data.message_type = "text";
        data.created_at = new Date(Date.now()).toISOString();
        data.updated_at = data.created_at;
        const result = await groupMessageModel.insertGroupMessage(data)

        // Response
        commonHelper.response(res, result.rows, 201, "Group message added");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed adding group message");
    }
}

const updateGroupMessage = async (req, res) => {
    try {
        // Get request group id and data
        const id = req.params.id;
        const id_user = req.payload.id;
        const data = req.body;

        // Check if group message exists in database
        const groupMessageResult = await groupMessageModel.selectGroupMessage(id);
        if (!groupMessageResult.rowCount) return commonHelper
            .response(res, null, 404, "Group message not found");

        // Check if group message is created by user logged in
        if (groupMessageResult.rows[0].sender != id_user)
            return commonHelper.response(res, null, 403,
                "Updating group message created by other user is not allowed");

        // Check if group message type is text
        if (groupMessageResult.rows[0].message_type != "text")
            return commonHelper.response(res, null, 403,
                "Updating message type other than text is not allowed");

        // Update group message in database
        data.id = id;
        data.updated_at = new Date(Date.now()).toISOString();
        const result = await groupMessageModel.updateGroupMessage(data);

        //Response
        commonHelper.response(res, result.rows, 201, "Group message updated");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed updating group message");
    }
}

const softDeleteGroupMessage = async (req, res) => {
    try {
        // Get request group id and data
        const id = req.params.id;
        const id_user = req.payload.id;

        // Check if group message exists in database
        const groupMessageResult = await groupMessageModel.selectGroupMessage(id);
        if (!groupMessageResult.rowCount) return commonHelper
            .response(res, null, 404, "Group message not found");

        // Check if group message is created by user logged in
        if (groupMessageResult.rows[0].sender != id_user)
            return commonHelper.response(res, null, 403,
                "Deleting group message created by other user is not allowed");

        // Delete group message in database
        const deleted_at = new Date(Date.now()).toISOString();
        const result = await groupMessageModel.softDeleteGroupMessage(id, deleted_at)

        //Response
        commonHelper.response(res, result.rows, 200, "Group message deleted");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed deleting group message");
    }
}

module.exports = {
    getAllGroupMessages,
    getGroupMessages,
    createGroupMessage,
    updateGroupMessage,
    softDeleteGroupMessage
}