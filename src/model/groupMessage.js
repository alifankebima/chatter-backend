const pool = require('../config/db');

const selectAllGroupMessages = (searchParam, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM group_messages WHERE message ILIKE 
        '%${searchParam}%' ORDER BY ${sortBy} ${sort} LIMIT ${limit} OFFSET 
        ${offset}`);
}

const selectGroupMessages = (id_group, searchParam, sortBy, sort, limit, offset) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM group_messages WHERE id_group='${id_group}' 
            AND message ILIKE '%${searchParam}%' ORDER BY ${sortBy} ${sort} 
            LIMIT ${limit} OFFSET ${offset}`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const selectGroupMessage = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM group_messages WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const insertGroupMessage = (data) => {
    const { id, id_group, sender, message, message_type, created_at,
        updated_at } = data;
    return pool.query(`INSERT INTO group_messages VALUES('${id}', '${id_group}', 
        '${sender}', '${message}', '${message_type}', '${created_at}', 
        '${updated_at}')`);
}

const updateGroupMessage = (data) => {
    const { id, message, updated_at } = data;
    return pool.query(`UPDATE group_messages SET message='${message}', 
        updated_at='${updated_at}' WHERE id='${id}'`);
}

const softDeleteGroupMessage = (id, deleted_at) => {
    return pool.query(`UPDATE group_messages SET deleted_at='${deleted_at}' 
        WHERE id='${id}'`);
}

module.exports = {
    selectAllGroupMessages,
    selectGroupMessages,
    selectGroupMessage,
    insertGroupMessage,
    updateGroupMessage,
    softDeleteGroupMessage,
}