const pool = require('../config/db');

const selectAllGroupMembers = (searchParam, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM group_members WHERE name ILIKE 
        '%${searchParam}%' AND deleted_at IS not null ORDER BY ${sortBy} ${sort} 
        LIMIT ${limit} OFFSET ${offset}`);
}

const selectGroupMembers = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM group_members WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const insertGroupMember = (data) => {
    const { id, id_group, id_user, created_at } = data;
    return pool.query(`INSERT INTO group_members VALUES('${id}', '${id_group}', 
        '${id_user}', '${created_at}')`);
}

const softDeleteGroupMember = (id, deleted_at) => {
    return pool.query(`UPDATE group_members SET deleted_at='${deleted_at}' 
        WHERE id='${id}'`);
}

const findId = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT id FROM group_members WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

module.exports = {
    selectAllGroupMembers,
    selectGroupMembers,
    insertGroupMember,
    softDeleteGroupMember,
    findId
}