const pool = require('../config/db');

const selectAllPrivateMessages = (searchParam, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM private_messages WHERE sender ILIKE 
        '%${searchParam}%' ORDER BY ${sortBy} ${sort} LIMIT ${limit} OFFSET 
        ${offset}`);
}

const selectSenderPrivateMessages = (searchParam, sender, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM private_messages WHERE message ILIKE 
        '%${searchParam}%' AND sender='${sender}' ORDER BY ${sortBy} ${sort} 
        LIMIT ${limit} OFFSET ${offset}`);
}

const selectReceiverPrivateMessages = (searchParam, receiver, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM private_messages WHERE message ILIKE 
        '%${searchParam}%' AND receiver='${receiver}' ORDER BY ${sortBy} 
        ${sort} LIMIT ${limit} OFFSET ${offset}`);
}

const selectPrivateMessage = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM private_messages WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const insertPrivateMessage = (data) => {
    const { id, sender, receiver, message, message_type, created_at } = data;
    return pool.query(`INSERT INTO private_messages VALUES('${id}', '${sender}', 
        '${receiver}', '${message}', '${message_type}', '${created_at}')`);
}

const updatePrivateMessage = (data) => {
    const { id, message, updated_at } = data;
    return pool.query(`UPDATE private_messages SET message='${message}', 
        '${updated_at}' WHERE id='${id}'`);
}

const softDeletePrivateMessage = (id, deleted_at) => {
    return pool.query(`UPDATE private_messages SET deleted_at='${deleted_at}' 
        WHERE id='${id}'`);
}

const findId = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT id FROM private_messages WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

module.exports = {
    selectAllPrivateMessages,
    selectSenderPrivateMessages,
    selectReceiverPrivateMessages,
    selectPrivateMessage,
    insertPrivateMessage,
    updatePrivateMessage,
    softDeletePrivateMessage,
    findId
}