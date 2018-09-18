CREATE SCHEMA `app-user` CHARACTER SET utf8 COLLATE utf8_bin;

use `app-user`;

drop table if exists `user_right`;
drop table if exists `right`;
drop table if exists `user`;
drop table if exists `issued_tokens`;
drop table if exists `blacklisted_tokens`;


CREATE TABLE `issued_tokens` (
  `jti` varchar(50) NOT NULL,
  `user_uuid` char(36) NOT NULL,
  `ip` varchar(39) DEFAULT NULL,
  `created_date` datetime not null DEFAULT now(),
  PRIMARY KEY (`jti`)
);


CREATE TABLE `blacklisted_tokens` (
  `jti` varchar(50) NOT NULL,
  `created_date` datetime not null DEFAULT now(),
  PRIMARY KEY (`jti`)
);


CREATE TABLE `user` (
  `uuid` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `is_email_verified` int default 0, 
  `is_phone_number_verified` int default 0, 
  `mfa_type` enum('none','sms','totp') NOT NULL DEFAULT 'none',
  `language` varchar(10) NOT NULL default 'en-GB',
  `deleted` int default 0, 
  `created_date` datetime NOT NULL default now(),
  `updated_date` datetime DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `user_email` (`email`, `deleted`)
);

CREATE TABLE `right` (
  `uuid` char(36) NOT NULL,
  `right_name` varchar(100) NOT NULL,
  PRIMARY KEY (uuid),
  UNIQUE KEY right_UK (uuid)
);


CREATE TABLE `user_right` (
  `user_uuid` char(36) NOT NULL,
  `right_uuid` char(36) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT now(),
  PRIMARY KEY (`user_uuid`, `right_uuid`),
  UNIQUE KEY `user_right_UK` (`right_uuid`, `user_uuid`),
  CONSTRAINT `user_right_right_fk` FOREIGN KEY (right_uuid) REFERENCES `right` (uuid),
  CONSTRAINT `user_right_user_fk` FOREIGN KEY (user_uuid) REFERENCES `user` (uuid)
);

insert into `right`(uuid, right_name) values ('1','system');

