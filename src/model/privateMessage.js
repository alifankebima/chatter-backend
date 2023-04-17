const pool = require('../config/db');

const selectAllPrivateMessages = (searchParam, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM private_messages WHERE message ILIKE 
        '%${searchParam}%' ORDER BY ${sortBy} ${sort} LIMIT ${limit} OFFSET 
        ${offset}`);
}

const selectUserPrivateMessages = (sender, receiver, limit, offset) => {
    // return pool.query(`SELECT * FROM private_messages WHERE sender='${sender}' 
    //     OR receiver='${receiver}' AND sender='${receiver}' OR 
    //     receiver='${sender}' ORDER BY created_at DESC LIMIT ${limit} 
    //     OFFSET ${offset}`);
    return pool.query(`SELECT pm.sender, u1.username as sender_username, 
        u1.fullname as sender_fullname, u1.image as sender_image, pm.receiver, 
        u2.username as receiver_username, u2.fullname as receiver_fullname, 
        u2.image as receiver_image, pm.message, pm.message_type, pm.created_at, pm.updated_at, pm.deleted_at FROM private_messages as pm INNER JOIN  
        users as u1 on u1.id = pm.sender INNER JOIN users as u2 on 
        u2.id = pm.receiver WHERE pm.sender='${sender}' OR pm.receiver='${receiver}' AND pm.sender='${receiver}' OR pm.receiver='${sender}' 
        ORDER BY pm.created_at ASC LIMIT ${limit} OFFSET ${offset}`);
}

// const selectReceiverPrivateMessageList = (user, limit, offset) => {
//     return pool.query(`SELECT pm.sender as pm_sender, private_messages.receiver as pm_receiver 
//         FROM private_messages AS pm INNER JOIN users AS user1 ON user1.id = private_messages.receiver 
//         inner join users AS user2 on user2.id = private_messages.sender 
//         LIMIT ${limit} OFFSET ${offset}`);
// }

// const selectReceiverPrivateMessageList = (user, limit, offset) => {
//     return pool.query(`SELECT DISTINCT private_messages.sender, 
//         private_messages.receiver FROM private_messages WHERE private_messages.receiver='${user}' 
//         OR private_messages.sender='${user}' LIMIT ${limit} OFFSET ${offset}`);
// }

const selectReceiverPrivateMessageList = (user, limit, offset) => {
    return pool.query(`SELECT DISTINCT pm.sender, u1.username as sender_username, 
        u1.fullname as sender_fullname, u1.image as sender_image, pm.receiver, 
        u2.username as receiver_username, u2.fullname as receiver_fullname, 
        u2.image as receiver_image FROM private_messages as pm INNER JOIN  
        users as u1 on u1.id = pm.sender INNER JOIN users as u2 on 
        u2.id = pm.receiver WHERE pm.sender='${user}' OR pm.receiver='${user}'
        LIMIT ${limit} OFFSET ${offset}`);
}

// const selectReceiverPrivateMessageList = (user, limit, offset) => {
//     return pool.query(`SELECT DISTINCT private_messages.sender AS id,
//         users.fullname, users.username, users.email, users.image, 
//         users.phone_number FROM (SELECT * FROM private_messages ORDER BY created_at DESC) 
//         AS private_messages INNER JOIN users ON private_messages.sender = users.id WHERE 
//         private_messages.receiver='${user}' OR private_messages.sender='${user}' 
//         LIMIT ${limit} OFFSET ${offset}`);
// }

// const selectSenderPrivateMessageList = (user, limit, offset) => {
//     return pool.query(`SELECT DISTINCT private_messages.receiver AS id,
//         users.fullname, users.username, users.email, users.image, 
//         users.phone_number FROM (SELECT * FROM private_messages ORDER BY created_at DESC) 
//         AS private_messages INNER JOIN users ON private_messages.receiver = users.id WHERE 
//         private_messages.sender='${user}' OR 
//         LIMIT ${limit} OFFSET ${offset}`);
// }

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