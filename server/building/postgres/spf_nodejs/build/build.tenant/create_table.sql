-- ALTER SCHEMA IF EXISTS globalsns RENAME TO globalsns_bk;
CREATE SCHEMA "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" AUTHORIZATION "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
set search_path to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

CREATE TABLE tenant_system_conf (
  conf_key varchar(513) NOT NULL,
  value text,
  PRIMARY KEY (conf_key)
) ;

CREATE SEQUENCE chatroom_member_store_id_seq;
CREATE TABLE chatroom_member_store (
  id bigint NOT NULL DEFAULT NEXTVAL('chatroom_member_store_id_seq'),
  room_id varchar(139) NOT NULL,
  jid varchar(513) NOT NULL,
  state integer NOT NULL DEFAULT '0',
  join_date timestamp DEFAULT NULL,
  leave_date timestamp DEFAULT NULL,
  join_jid varchar(513) DEFAULT NULL,
  leave_jid varchar(513) DEFAULT NULL,
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE chatroom_store_id_seq;
CREATE TABLE chatroom_store (
  id bigint NOT NULL DEFAULT NEXTVAL('chatroom_store_id_seq'),
  notify_type integer DEFAULT 0 NOT NULL,
  room_id varchar(139) NOT NULL,
  room_name varchar(512) NOT NULL,
  created_at timestamp NOT NULL,
  created_by varchar(512) NOT NULL,
  updated_at timestamp DEFAULT NULL,
  updated_by varchar(513) NOT NULL DEFAULT '',
  delete_flag integer NOT NULL DEFAULT '0',
  deleted_at timestamp DEFAULT NULL,
  deleted_by varchar(513) NOT NULL DEFAULT '',
  parent_room_id varchar(272) NOT NULL DEFAULT '',
  privacy_type integer not null default 2,
  extras jsonb DEFAULT NULL,
  extra1 varchar(256) NOT NULL DEFAULT '',
  extra2 varchar(256) NOT NULL DEFAULT '',
  extra3 varchar(256) NOT NULL DEFAULT '',
  extra4 varchar(256) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE (room_id)
) ;
CREATE INDEX chatroom_store_parent_room_id_key ON chatroom_store (parent_room_id);

CREATE SEQUENCE community_member_store_id_seq;
CREATE TABLE community_member_store (
  id bigint NOT NULL DEFAULT NEXTVAL('community_member_store_id_seq'),
  room_id varchar(272) NOT NULL,
  jid varchar(513) NOT NULL,
  state integer NOT NULL DEFAULT '0',
  role integer NOT NULL DEFAULT '0',
  join_date timestamp DEFAULT NULL,
  leave_date timestamp DEFAULT NULL,
  PRIMARY KEY (id)
) ;
CREATE INDEX community_member_store_room_id_key on community_member_store(room_id,jid);


CREATE SEQUENCE community_store_id_seq;
CREATE TABLE community_store (
  id bigint NOT NULL DEFAULT NEXTVAL('community_store_id_seq'),
  room_id varchar(272) NOT NULL,
  room_name text NOT NULL,
  description text,
  privacy_type integer NOT NULL DEFAULT '2',
  member_entry_type integer NOT NULL DEFAULT '0',
  notify_type integer DEFAULT 0 NOT NULL,
  logoUrl text,
  created_at timestamp NOT NULL,
  created_by varchar(513) NOT NULL,
  updated_at timestamp DEFAULT NULL,
  updated_by varchar(513) NOT NULL DEFAULT '',
  delete_flag integer NOT NULL DEFAULT '0',
  deleted_at timestamp DEFAULT NULL,
  deleted_by varchar(513) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE (room_id)
) ;

CREATE SEQUENCE follow_store_id_seq;
CREATE TABLE follow_store (
  id bigint NOT NULL DEFAULT NEXTVAL('follow_store_id_seq'),
  jid varchar(513) NOT NULL DEFAULT '',
  follow_jid varchar(513) NOT NULL DEFAULT '',
  status integer NOT NULL DEFAULT '0',
  date timestamp DEFAULT NULL,
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE goodjob_store_id_seq;
CREATE TABLE goodjob_store (
  id bigint NOT NULL DEFAULT NEXTVAL('goodjob_store_id_seq'),
  item_id varchar(139) NOT NULL,
  item_keeper_jid varchar(513) NOT NULL,
  gj_jid varchar(513) NOT NULL,
  date timestamp NOT NULL,
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE mail_body_store_id_seq;
CREATE TABLE mail_body_store (
  id bigint NOT NULL DEFAULT NEXTVAL('mail_body_store_id_seq'),
  item_id varchar(139) NOT NULL DEFAULT '',
  jid varchar(513) NOT NULL DEFAULT '',
  mail_body text,
  PRIMARY KEY (id)
) ;
CREATE INDEX mail_body_store_item_id_key on mail_body_store(item_id,id);

CREATE SEQUENCE mail_cooperation_store_id_seq;
CREATE TABLE mail_cooperation_store (
  id bigint NOT NULL DEFAULT NEXTVAL('mail_cooperation_store_id_seq'),
  server_id bigint NOT NULL,
  jid varchar(513) NOT NULL DEFAULT '',
  branch_number bigint NOT NULL,
  mail_address varchar(2290) NOT NULL DEFAULT '',
  setting_info text,
  delete_flag integer NOT NULL DEFAULT '0',
  mail_cooperation_type integer NOT NULL DEFAULT '0',
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE mail_server_list_id_seq;
CREATE TABLE mail_server_list (
  id bigint NOT NULL DEFAULT NEXTVAL('mail_server_list_id_seq'),
  display_name text,
  server_type integer NOT NULL DEFAULT '0',
  created_at timestamp NOT NULL,
  created_by varchar(513) NOT NULL DEFAULT '',
  updated_at timestamp DEFAULT NULL,
  updated_by varchar(513) NOT NULL DEFAULT '',
  delete_flag integer NOT NULL DEFAULT '0',
  deleted_at timestamp DEFAULT NULL,
  deleted_by varchar(513) NOT NULL DEFAULT '',
  pop_host varchar(512) NOT NULL DEFAULT '',
  pop_port integer NOT NULL DEFAULT '0',
  pop_auth_mode integer NOT NULL DEFAULT '0',
  pop_response_timeout integer NOT NULL DEFAULT '60',
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE message_sendto_list_store_id_seq;
CREATE TABLE message_sendto_list_store (
  id bigint NOT NULL DEFAULT NEXTVAL('message_sendto_list_store_id_seq'),
  item_id varchar(139) NOT NULL,
  send_to varchar(256) NOT NULL,
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE notification_store_id_seq;
CREATE TABLE notification_store (
  id bigint NOT NULL DEFAULT NEXTVAL('notification_store_id_seq'),
  notification_type integer NOT NULL,
  data_type integer NOT NULL,
  notification_data text NOT NULL,
  jid varchar(513) NOT NULL DEFAULT '',
  notified_date timestamp DEFAULT NULL,
  PRIMARY KEY (id)
) ;
CREATE INDEX notification_store_jid_key on notification_store(jid,notification_type,id);

CREATE SEQUENCE publicmessage_store_id_seq;
CREATE TABLE publicmessage_store (
  id bigint NOT NULL DEFAULT NEXTVAL('publicmessage_store_id_seq'),
  item_id varchar(139) NOT NULL,
  msgtype integer NOT NULL,
  msgfrom varchar(512) NOT NULL,
  msgto varchar(256) NOT NULL,
  entry text,
  thread_root_id varchar(139) NOT NULL DEFAULT '',
  publish_nodename varchar(263) NOT NULL,
  created_at timestamp NOT NULL,
  reply_id varchar(139) DEFAULT NULL,
  reply_to varchar(513) DEFAULT NULL,
  start_date timestamp DEFAULT NULL,
  due_date timestamp DEFAULT NULL,
  owner varchar(513) DEFAULT NULL,
  group_name text,
  status integer DEFAULT NULL,
  complete_date timestamp DEFAULT NULL,
  priority integer DEFAULT '1',
  updated_at timestamp DEFAULT NULL,
  updated_by varchar(513) NOT NULL DEFAULT '',
  client varchar(513) NOT NULL DEFAULT '',
  show_type integer NOT NULL DEFAULT '1',
  parent_item_id varchar(139) NOT NULL DEFAULT '',
  delete_flag integer NOT NULL DEFAULT '0',
  deleted_at timestamp DEFAULT NULL,
  deleted_by varchar(1024) NOT NULL DEFAULT '',
  mail_message_id varchar(128) NOT NULL DEFAULT '',
  mail_in_reply_to varchar(128) NOT NULL DEFAULT '',
  demand_status integer NOT NULL DEFAULT '0',
  demand_date timestamp DEFAULT NULL,
  quotation_message_id bigint DEFAULT NULL,
  body_type integer NOT NULL DEFAULT '0',
  PRIMARY KEY (id)
) ;
CREATE INDEX publicmessage_store_pitem_id_key on publicmessage_store(parent_item_id,owner,client);
CREATE INDEX publicmessage_store_item_id_key on publicmessage_store(item_id);
CREATE INDEX publicmessage_store_reply_id_key on publicmessage_store (reply_id);

CREATE TABLE publicmessage_logs (
 id bigserial PRIMARY KEY,
 item_id varchar(139) NOT NULL,
 entry TEXT NOT NULL default '',
 created_at timestamp without time zone,
 created_by varchar(513) NOT NULL default '',
 moved_at timestamp without time zone,
 moved_by varchar(513) NOT NULL default ''
);

CREATE TABLE thread_store
(
 id bigserial PRIMARY KEY,
 thread_title varchar(1024) NOT NULL,
 thread_root_id  varchar(139)  default NULL::character varying unique,
 room_id  varchar(513) default NULL::character varying,
 created_at timestamp without time zone,
 created_by varchar(513) NOT NULL default ''
);
CREATE INDEX thread_store_seq_room_id_key ON thread_store (room_id);

CREATE TABLE thread_store_log
(
 id bigserial PRIMARY KEY,
 thread_title varchar(1024) NOT NULL,
 thread_root_id  varchar(139) default NULL::character varying,
 room_id  varchar(513) default NULL::character varying,
 created_at timestamp without time zone,
 created_by varchar(513) NOT NULL default '',
 moved_at timestamp without time zone
);

CREATE TABLE quotation_message_store
(
  id bigserial PRIMARY KEY,
  private_flag integer not null default 1,
  quotation_item_id varchar(139) NOT NULL,
  entry text,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  msgtype integer not null,
  msgfrom varchar(512) not null,
  msgto varchar(512) not null,
  nickname text,
  photo_type character varying(30) default NULL::character varying,
  photo_data text,
  user_name text,
  affiliation text
);

CREATE TABLE read_message_date_store (
  id bigint NOT NULL,
  item_id varchar(139) NOT NULL,
  read_user_datetimes text,
  first_read_date timestamp DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE (item_id)
) ;

CREATE TABLE read_message_info_store (
  id bigint NOT NULL,
  item_id varchar(139) NOT NULL,
  read_user_ids text,
  last_read_date timestamp DEFAULT NULL,
  last_read_user_id bigint DEFAULT NULL,
  count bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (id),
  UNIQUE (item_id)
) ;

CREATE SEQUENCE tasknote_store_id_seq;
CREATE TABLE tasknote_store (
  id bigint NOT NULL DEFAULT NEXTVAL('tasknote_store_id_seq'),
  item_id varchar(139) NOT NULL,
  sender_jid varchar(513) NOT NULL,
  message text,
  date timestamp NOT NULL,
  PRIMARY KEY (id)
) ;

CREATE SEQUENCE user_profile_id_seq;
CREATE TABLE user_profile (
  id integer NOT NULL DEFAULT NEXTVAL('user_profile_id_seq'),
  jid varchar(513) NOT NULL DEFAULT '',
  mailaddress varchar(2290) NOT NULL DEFAULT '',
  password varchar(512) NOT NULL DEFAULT '',
  name text,
  nickname text,
  presence integer DEFAULT '5',
  my_memo text,
  photo_type varchar(30) DEFAULT NULL,
  photo_data text  ,
  update_time timestamp DEFAULT NULL,
  delete_flg integer DEFAULT '0',
  affiliation text,
  notification_client_last_updated_at timestamp DEFAULT NULL,
  extras jsonb DEFAULT NULL,
  extra1 varchar(256) NOT NULL DEFAULT '',
  extra2 varchar(256) NOT NULL DEFAULT '',
  extra3 varchar(256) NOT NULL DEFAULT '',
  extra4 varchar(256) NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ;
CREATE INDEX user_profile_jid_key on user_profile(jid,id);

CREATE TABLE emotion_store
(
id bigserial PRIMARY KEY,
item_id varchar(139) NOT NULL,
jid varchar(513) NOT NULL,
emotion_point int NOT NULL DEFAULT 0,
created_at timestamp without time zone,
updated_at timestamp without time zone
);
CREATE INDEX emotion_store_item_id_key ON emotion_store (item_id);

ALTER TABLE chatroom_store ADD COLUMN IF NOT EXISTS emotion_point_icon jsonb DEFAULT '{}';

ALTER TABLE community_store ADD COLUMN IF NOT EXISTS emotion_point_icon jsonb DEFAULT '{}';

CREATE TABLE note_store
(
  id bigserial PRIMARY KEY,
  note_title varchar(512) NOT NULL,
  note_url   text         NOT NULL UNIQUE,
  thread_root_id    varchar(139) DEFAULT '',
  ownjid     varchar(512) NOT NULL,
  codimd_uid  varchar(255) NOT NULL,
  created_at timestamp without time zone,
  updated_at timestamp without time zone
);

CREATE INDEX note_store_ownjid_index  ON note_store (ownjid);

-- for questionnaire

CREATE SEQUENCE pickup_room_store_id_seq;
CREATE TABLE pickup_room_store (
    id bigint DEFAULT nextval('pickup_room_store_id_seq') NOT NULL,
    jid varchar(513) NOT NULL,
    pickup_room_id varchar(272) NOT NULL,
    room_type integer NOT NULL,
    contact varchar(513) NOT NULL,
    update_date timestamp NOT NULL,
	PRIMARY KEY (id)
);

CREATE SEQUENCE publicmessage_questionnaire_store_id_seq;
CREATE TABLE publicmessage_questionnaire_store (
    id bigint DEFAULT nextval('publicmessage_questionnaire_store_id_seq') NOT NULL,
	room_type integer NOT NULL,
    item_id varchar(139) NOT NULL,
    input_type integer NOT NULL,
    result_visible integer NOT NULL,
    graph_type integer NOT NULL,
	PRIMARY KEY (id)
);
CREATE INDEX publicmessage_questionnaire_store_item_id_key ON publicmessage_questionnaire_store(item_id);

CREATE SEQUENCE questionnaire_option_store_id_seq;
CREATE TABLE questionnaire_option_store (
    id bigint DEFAULT nextval('questionnaire_option_store_id_seq') NOT NULL,
    item_id varchar(139) NOT NULL,
    option text NOT NULL,
	PRIMARY KEY (id)
);
CREATE INDEX questionnaire_option_store_item_id_key ON questionnaire_option_store(item_id);

CREATE SEQUENCE questionnaire_vote_store_id_seq;
CREATE TABLE questionnaire_vote_store (
    id bigint DEFAULT nextval('questionnaire_vote_store_id_seq') NOT NULL,
    item_id varchar(139) NOT NULL,
    option_id bigint NOT NULL,
    vote_user_ids text,
    count bigint DEFAULT 0 NOT NULL,
	PRIMARY KEY (id)
);
CREATE INDEX questionnaire_vote_store_item_id_key ON questionnaire_vote_store(item_id);

CREATE TABLE note_account_store (
    jid varchar(513) NOT NULL PRIMARY KEY,
    status integer not null default 0,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);

CREATE TABLE hashtag_store (
    item_id varchar(139) NOT NULL,
    jid varchar(513) NOT NULL,
    tagname varchar(513) NOT NULL,
    created_at timestamp without time zone
);

