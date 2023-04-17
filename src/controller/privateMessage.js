const { v4: uuidv4 } = require('uuid');
const commonHelper = require('../helper/common');
const userModel = require('../model/user');
const privateMessageModel = require('../model/privateMessage');

const getAllPrivateMessages = async (req, res) => {
    try {
        // Search and pagination query
        const searchParam = req.query.search || '';
        const sortBy = req.query.sortBy || 'created_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Get all private messages from database
        const results = await privateMessageModel
            .selectAllPrivateMessages(searchParam, sortBy, sort, limit, offset);

        // Return not found if there's no group messages in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Private message not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get all private messages successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting all private messages");
    }
}

const getReceiverPrivateMessages = async (req, res) => {
    try {
        // Get request id sender, id receiver, and pagination query
        const id_sender = req.payload.id;
        const id_receiver = req.params.id_receiver;
        const limit = Number(req.query.limit) || 50;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        console.log(id_sender);
        console.log(id_receiver);

        // Check if requested data exists
        if (!id_sender) return commonHelper.response(res, null, 400,
            "User must provide id sender")

        // Get private messages from database
        const results = await privateMessageModel
            .selectUserPrivateMessages(id_sender, id_receiver, limit, offset)

        // Return not found if there's no group messages in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Private message not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get user private messages successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting user private messages");
    }
}

const getUserPrivateMessageList = async (req, res) => {
    try {
        // Get request id sender, id receiver, and pagination query
        const id_user = req.payload.id;
        const limit = Number(req.query.limit) || 50;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Get private messages from database
        const results = await privateMessageModel
            .selectReceiverPrivateMessageList(id_user, limit, offset)

        // Return not found if there's no group messages in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Private message list not found");

        // Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        // Return page invalid if page params is more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        // Response
        commonHelper.response(res, results.rows, 200,
            "Get user private message list successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting user private message list");
    }
}

const createPrivateMessage = async (req, res) => {
    try {
        // Get request private data and group title
        const data = req.body;
        data.receiver = req.params.id_receiver;
        const id_user = req.payload.id;

        // Check if requested data exists
        if (!data.receiver || !data.message) return commonHelper
            .response(res, null, 400, "User must provide id receiver and message");

        // Check if receiver exists in database
        const userResult = await userModel.findId(data.receiver);
        if (!userResult.rowCount) return commonHelper.response(res, null, 404,
            "User not found");

        // Insert private message to database
        data.id = uuidv4();
        data.sender = id_user;
        data.message_type = "text";
        data.created_at = new Date(Date.now()).toISOString();
        data.updated_at = data.created_at;
        const result = await privateMessageModel.insertPrivateMessage(data);

        // Response
        commonHelper.response(res, result.rows, 201, "Private message sent");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed sending private message");
    }
}

const updatePrivatepMessage = async (req, res) => {
    try {
        // Get request group id and data
        const id = req.params.id;
        const id_user = req.payload.id;
        const data = req.body;

        // Check if private message exists in database
        const privateMessageResult = await privateMessageModel
            .selectPrivateMessage(id)
        if (!privateMessageResult.rowCount) return commonHelper
            .response(res, null, 404, "Private message not found");

        // Check if private message is created by user logged in
        if (privateMessageResult.rows[0].sender != id_user)
            return commonHelper.response(res, null, 403,
                "Updating private message created by other user is not allowed");

        // Check if private message type is text
        if (privateMessageResult.rows[0].message_type != "text")
            return commonHelper.response(res, null, 403,
                "Updating message type other than text is not allowed");

        // Update private message in database
        data.id = id;
        data.updated_at = new Date(Date.now()).toISOString();
        const result = await privateMessageModel.updatePrivateMessage(data);

        //Response
        commonHelper.response(res, result.rows, 201, "Private message updated");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed updating private message");
    }
}

const softDeletePrivateMessage = async (req, res) => {
    try {
        // Get request private meesage id and data
        const id = req.params.id;
        const id_user = req.payload.id;

        // Check if private message exists in database
        const privateMessageResult = await privateMessageModel
            .selectPrivateMessage(id)
        if (!privateMessageResult.rowCount) return commonHelper
            .response(res, null, 404, "Private message not found");

        // Check if private message is created by user logged in
        if (privateMessageResult.rows[0].sender != id_user)
            return commonHelper.response(res, null, 403,
                "Deleting private message created by other user is not allowed");

        // Delete group message in database
        const deleted_at = new Date(Date.now()).toISOString();
        const result = await privateMessageModel
            .softDeletePrivateMessage(id, deleted_at);

        //Response
        commonHelper.response(res, result.rows, 200, "Private message deleted");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed deleting private message");
    }
}

module.exports = {
    getAllPrivateMessages,
    getReceiverPrivateMessages,
    getUserPrivateMessageList,
    createPrivateMessage,
    updatePrivatepMessage,
    softDeletePrivateMessage
}