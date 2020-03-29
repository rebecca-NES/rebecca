-- ALTER SCHEMA IF EXSITS globalsns_manager RENAME TO globalsns_manager_bk;
CREATE SCHEMA globalsns_manager AUTHORIZATION globalsns_admin;
set search_path to globalsns_manager;

CREATE TABLE cubee_system (
  db_version int4 NOT NULL DEFAULT '0'
) ;

CREATE SEQUENCE device_info_store_id_seq;
CREATE TABLE device_info_store (
  id bigint NOT NULL default NEXTVAL('device_info_store_id_seq'),
  device_id text NOT NULL,
  jid varchar(513) NOT NULL DEFAULT '',
  notification_service integer NOT NULL DEFAULT '0',
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE shorten_uri_store_Id_seq;
CREATE TABLE shorten_uri_store (
  Id bigint NOT NULL default NEXTVAL('shorten_uri_store_Id_seq'),
  shorten_uri varchar(32) NOT NULL,
  urlid varchar(6) NOT NULL,
  displayed_uri text NOT NULL,
  original_uri text NOT NULL,
  counter bigint NOT NULL,
  PRIMARY KEY (Id),
  UNIQUE (urlid)
) ;

CREATE TABLE system_conf (
  conf_key varchar(513) NOT NULL,
  value text NOT NULL,
  PRIMARY KEY (conf_key)
) ;

CREATE SEQUENCE user_account_store_id_seq;
CREATE TABLE user_account_store (
  id integer NOT NULL DEFAULT NEXTVAL('user_account_store_id_seq'),
  tenant_uuid char(36) NOT NULL,
  login_account varchar(252) NOT NULL,
  openfire_account varchar(256) NOT NULL,
  xmpp_server_name varchar(255) NOT NULL,
  mailaddress varchar(2290) NOT NULL DEFAULT '',
  update_time timestamp DEFAULT NULL,
  delete_flg integer NOT NULL DEFAULT '0',
  PRIMARY KEY (id),
  UNIQUE  (tenant_uuid,login_account),
  UNIQUE  (openfire_account,xmpp_server_name)
) ;

CREATE TABLE globalsns_manager.tenant_store(
    uuid         character(36)                              PRIMARY KEY
  , name         character varying(256)                     NOT NULL UNIQUE
  , conf         jsonb
  , update_time  timestamp without time zone
  , delete_flg   integer                      DEFAULT 0     NOT NULL
);

CREATE TABLE globalsns_manager.xmpp_server_store(
    server_name         character varying(256)
  , tenant_uuid         character(36)
  , port_clnt           integer                      DEFAULT 5222  NOT NULL
  , port_clnt_ssl       integer                      DEFAULT 5223  NOT NULL
  , port_crs_dmn        integer                      DEFAULT 5229  NOT NULL
  , port_srv            integer                      DEFAULT 5269  NOT NULL
  , port_http_bndng     integer                      DEFAULT 7070  NOT NULL
  , port_http_bndng_ssl integer                      DEFAULT 7443  NOT NULL
  , port_fl_trsfr       integer                      DEFAULT 7777  NOT NULL
  , port_admn_cnsl      integer                      DEFAULT 9090  NOT NULL
  , port_admn_cnsl_ssl  integer                      DEFAULT 9091  NOT NULL
  , update_time         timestamp without time zone
  , delete_flg          integer                      DEFAULT 0     NOT NULL
  , PRIMARY KEY ( tenant_uuid, server_name )
);
