const pool = require('../config/db');

const selectAllUsers = (searchParam, sortBy, sort, limit, offset) => {
    return pool.query(`SELECT * FROM users WHERE username ILIKE 
        '%${searchParam}%' AND deleted_at IS not null ORDER BY ${sortBy} 
        ${sort} LIMIT ${limit} OFFSET ${offset}`);
}

const selectUser = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM users WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const insertUser = (data) => {
    const { id, fullname, username, email, password, created_at } = data;
    return pool.query(`INSERT INTO users(id, fullname, username, email, 
        password, created_at) VALUES('${id}', '${fullname}', '${username}', 
        '${email}', '${password}', '${created_at}')`);
}

const updateUser = (data) => {
    const { id, fullname, username, email, password, image, 
        phone_number, updated_at } = data;
    return pool.query(`UPDATE users SET 
        ${fullname ? "fullname='" + fullname + "', " : ""}
        ${username ? "username='" + username + "', " : ""}
        ${email ? "email='" + email + "', " : ""}
        ${password ? "password='" + password + "', " : ""}
        ${image ? "image='" + image + "', " : ""}
        ${phone_number ? "phone_number='" + phone_number + "', " : ""}
        '${updated_at}' WHERE id='${id}'`);
}

const softDeleteUser = (id, deleted_at) => {
    return pool.query(`UPDATE users SET deleted_at='${deleted_at}' 
        WHERE id='${id}'`);
}

const deleteUser = (id) => {
    return pool.query(`DELETE FROM users WHERE id='${id}'`);
}

const verifyEmail = (email) => {
    return pool.query(`UPDATE users SET email_verified=true WHERE email='${email}'`)
}

const findId = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT id FROM users WHERE id='${id}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const findEmail = (email) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM users WHERE email='${email}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const findEmailVerified = (email) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT email FROM users WHERE email='${email}' 
            AND email_verified=true`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const findUsername = (username) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT username FROM users WHERE username='${username}'`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

const findUserDeleted = (id) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT username FROM users WHERE id='${id}' 
            AND deleted_at IS not null`,
            (error, result) => (!error) ? resolve(result) : reject(error)));
}

module.exports = {
    selectAllUsers,
    selectUser,
    insertUser,
    updateUser,
    softDeleteUser,
    deleteUser,
    verifyEmail,
    findId,
    findEmail,
    findEmailVerified,
    findUsername
}