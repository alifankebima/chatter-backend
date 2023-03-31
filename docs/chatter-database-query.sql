-- CREATE DATABASE

create database chatter;
\l
\c chatter

-- CREATE TYPE

create type message_type as enum(
    'text',
    'image',
    'video',
    'sticker'
);

-- CREATE TABLE

create table users(
    id varchar(36) not null primary key,
    fullname varchar(40) not null,
    username varchar(40) not null unique,
    email varchar(60) not null unique,
    password varchar(128) not null,
    image varchar,
    phone_number varchar(16),
    email_verified boolean default(false),
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz
);

create table private_messages(
    id varchar(36) not null primary key,
    sender varchar(36) references users on update cascade on delete cascade,
    foreign key (sender) references users(id),
    receiver varchar(36) references users on update cascade on delete cascade,
    foreign key (receiver) references users(id),
    message text not null,
    message_type message_type not null,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz
);

create table groups(
    id varchar(36) not null primary key,
    id_owner varchar(36) references users on update cascade on delete cascade,
    foreign key (id_owner) references users(id),
    name varchar(40) not null,
    image varchar,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz
);

create table group_members(
    id varchar(36) not null primary key,
    id_group varchar(36) references groups on update cascade on delete cascade,
    foreign key (id_group) references groups(id),
    id_user varchar(36) references users on update cascade on delete cascade,
    foreign key (id_user) references users(id),
    created_at timestamptz,
    deleted_at timestamptz
);

create table group_messages(
    id varchar(36) not null primary key,
    id_group varchar(36) references groups on update cascade on delete cascade,
    foreign key (id_group) references groups(id),
    sender varchar(36) references users on update cascade on delete cascade,
    foreign key (sender) references users(id),
    message text not null,
    message_type message_type not null,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz
);