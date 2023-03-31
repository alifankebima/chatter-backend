const { v4: uuidv4 } = require('uuid');
const commonHelper = require('../helper/common');
const groupModel = require('../model/group');
const groupMemberModel = require('../model/groupMember');


const getAllGroupMembers = async (req, res) => {
    try {
        //Pagination query
        const sortBy = req.query.sortBy || 'created_at';
        const sort = req.query.sort || 'desc';
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        //Get all group members from database
        const results = await groupMemberModel
            .selectAllGroupMembers(sortBy, sort, limit, offset);

        //Return not found if there's no group members in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Group member not found");

        //Pagination info
        const totalData = results.rowCount;
        const totalPage = Math.ceil(totalData / limit);
        const pagination = { currentPage: page, limit, totalData, totalPage };

        //Return if page params more than total page
        if (page > totalPage) return commonHelper
            .response(res, null, 404, "Page invalid", pagination);

        //Response
        commonHelper.response(res, results.rows, 200,
            "Get all group members successful", pagination);
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting all group members");
    }
}

const getGroupMembers = async (req, res) => {
    try {
        //Get request group id
        const id_group = req.params.id_group;

        //Get all group members from database
        const results = await groupMemberModel.selectGroupMembers(id_group);

        //Return not found if there's no group members in database
        if (!results.rowCount) return commonHelper
            .response(res, null, 404, "Group members not found");

        //Response
        commonHelper.response(res, results.rows, 200,
            "Get group members successful");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed getting all group members");
    }
}

// This controller adds logged in user to specified group
// Instead of inviting other user to group
const createGroupMember = async (req, res) => {
    try {
        // Get request group member data
        const data = {};
        data.id_group = req.params.id_group;
        const id_user = req.payload.id;

        // Check if requested data exists
        if (!data.id_group) return commonHelper
            .response(res, null, 400, "Client must provide id group");

        // Check if group exists
        const groupResult = await groupModel.findId(data.id_group);
        if (!groupResult.rowCount) return commonHelper.response(res, null, 404,
            "Group not found")

        // Check if user already joined group
        const groupMemberResult = await groupMemberModel
            .findGroupMember(data.id_group, id_user);
        if (groupMemberResult.rowCount) return commonHelper
            .response(res, null, 403, "User already joined group");

        // Insert group member to database
        data.id = uuidv4();
        data.id_user = id_user;
        data.created_at = new Date(Date.now()).toISOString();
        const result = await groupMemberModel.insertGroupMember(data);

        //Response
        commonHelper.response(res, result.rows, 201, "User joined group");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed user joining group");
    }
}

// This controller removes logged in user from specified group
// Instead of removing other user by group owner
const softDeleteGroupMember = async (req, res) => {
    try {
        // Get request user id
        const id_group = req.params.id_group;
        const id_user = req.payload.id;

        // Check if group exists
        const groupResult = await groupModel.findId(id_group);
        console.log(id_group)
        if (!groupResult.rowCount) return commonHelper.response(res, null, 404,
            "Group not found");

        // Check if user have joined group
        const groupMemberResult = await groupMemberModel
            .findGroupMember(id_group, id_user)
        if (!groupMemberResult.rowCount) return commonHelper
            .response(res, null, 403, "User haven't joined or already leaved group");

        // Soft delete user from group member
        const deleted_at = new Date(Date.now()).toISOString();
        const result = await groupMemberModel
            .softDeleteGroupMember(id_group, id_user, deleted_at)

        //Response
        commonHelper.response(res, result.rows, 200, "User leaved group");
    } catch (error) {
        console.log(error);
        commonHelper.response(res, null, 500, "Failed user leaving group");
    }
}

module.exports = {
    getAllGroupMembers,
    getGroupMembers,
    createGroupMember,
    softDeleteGroupMember
}