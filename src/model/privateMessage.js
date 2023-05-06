const pool = require('../config/db');

const selectAllPrivateMessages = (searchParam, sortBy, sort, LIMIT, offset) => {
    return pool.query(`SELECT * FROM private_messages WHERE message ILIKE 
        '%${searchParam}%' ORDER BY ${sortBy} ${sort} LIMIT ${LIMIT} OFFSET 
        ${offset}`);
}

const selectUserPrivateMessages = (sender, receiver, LIMIT, offset) => {
    // return pool.query(`SELECT * FROM private_messages WHERE sender='${sender}' 
    //     OR receiver='${receiver}' AND sender='${receiver}' OR 
    //     receiver='${sender}' ORDER BY created_at DESC LIMIT ${LIMIT} 
    //     OFFSET ${offset}`);
    return pool.query(`SELECT pm.sender, u1.username AS sender_username, 
        u1.fullname AS sender_fullname, u1.image AS sender_image, pm.receiver, 
        u2.username AS receiver_username, u2.fullname AS receiver_fullname, 
        u2.image AS receiver_image, pm.message, pm.message_type, pm.created_at, pm.updated_at, pm.deleted_at FROM private_messages AS pm INNER JOIN  
        users AS u1 on u1.id = pm.sender INNER JOIN users AS u2 on 
        u2.id = pm.receiver WHERE pm.sender='${sender}' OR pm.receiver='${receiver}' AND pm.sender='${receiver}' OR pm.receiver='${sender}' 
        ORDER BY pm.created_at ASC LIMIT ${LIMIT} OFFSET ${offset}`);
}

const selectReceiverPrivateMessageList = (user, LIMIT, offset) => {
    return pool.query(`SELECT DISTINCT 
            pm.sender, u1.username AS sender_username, 
            u1.fullname AS sender_fullname, u1.image AS sender_image, 
            pm.receiver, u2.username AS receiver_username, 
            u2.fullname AS receiver_fullname, u2.image AS receiver_image, 
            (SELECT created_at FROM private_messages WHERE sender='${user}' 
                OR receiver='${user}' ORDER BY created_at DESC LIMIT 1), 
            (SELECT message FROM private_messages WHERE sender='${user}' 
                OR receiver='${user}' ORDER BY created_at DESC LIMIT 1) 
        FROM private_messages AS pm 
        INNER JOIN users AS u1 on u1.id = pm.sender 
        INNER JOIN users AS u2 on u2.id = pm.receiver 
        WHERE pm.sender='${user}' or pm.receiver='${user}'
        LIMIT ${LIMIT} OFFSET ${offset}`);
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
        updated_at='${updated_at}' WHERE id='${id}'`);
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
    selectUserPrivateMessages,
    selectReceiverPrivateMessageList,
    selectPrivateMessage,
    insertPrivateMessage,
    updatePrivateMessage,
    softDeletePrivateMessage,
    findId
}