const pool = require('../config/db');

const selectAllGroups = (searchParam, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM groups WHERE name ILIKE '%${searchParam}%' 
        AND deleted_at IS null ORDER BY ${sortBy} ${sort} LIMIT ${limit} 
        OFFSET ${offset}`);
}

const selectGroup = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM groups WHERE id='${id}' 
            AND deleted_at IS null`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const insertGroup = (data) => {
    const { id, id_owner, name, created_at, updated_at } = data;
    return pool.query(`INSERT INTO groups(id, id_owner, name, created_at, 
        updated_at) VALUES('${id}', '${id_owner}', '${name}', '${created_at}',
        '${updated_at}')`);
}

const updateGroup = (data) => {
    const { id, name, image, updated_at } = data;
    return pool.query(`UPDATE groups SET 
        ${name ? "name='" + name + "', " : ""}
        ${image ? "image='" + image + "', " : ""}
        updated_at='${updated_at}' WHERE id='${id}'`);
}

const softDeleteGroup = (id, deleted_at) => {
    return pool.query(`UPDATE groups SET deleted_at='${deleted_at}' 
        WHERE id='${id}'`);
}

const findId = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT id FROM groups WHERE id='${id}' AND deleted_at IS null`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

module.exports = {
    selectAllGroups,
    selectGroup,
    insertGroup,
    updateGroup,
    softDeleteGroup,
    findId
}