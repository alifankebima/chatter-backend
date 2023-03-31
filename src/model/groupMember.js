const pool = require('../config/db');

const selectAllGroupMembers = (sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM group_members WHERE deleted_at IS null 
        ORDER BY ${sortBy} ${sort} LIMIT ${limit} OFFSET ${offset}`);
}

const selectGroupMembers = (id_group) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM group_members WHERE id_group='${id_group}'
            AND deleted_at IS null`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const insertGroupMember = (data) => {
    const { id, id_group, id_user, created_at } = data;
    return pool.query(`INSERT INTO group_members VALUES('${id}', '${id_group}', 
        '${id_user}', '${created_at}')`);
}

const softDeleteGroupMember = (id_group, id_user, deleted_at) => {
    return pool.query(`UPDATE group_members SET deleted_at='${deleted_at}' 
        WHERE id_group='${id_group}' AND id_user='${id_user}'`);
}

const findGroupMember = (id_group, id_user) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM group_members WHERE id_group='${id_group}'
            AND id_user='${id_user}' AND deleted_at IS null`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

module.exports = {
    selectAllGroupMembers,
    selectGroupMembers,
    insertGroupMember,
    softDeleteGroupMember,
    findGroupMember
}