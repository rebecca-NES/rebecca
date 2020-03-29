\c globalsns globalsns_admin;
set search_path to globalsns_manager;

insert into cubee_system (db_version) values (18);

insert into system_conf (conf_key,value) values ('GCM_API_KEY','XXXXXXXXXXXXSagbwVSx8n9p9IF5REa6lnwIyew');
insert into system_conf (conf_key,value) values ('SERVER_URL', 'spf-dckr-px_0001' || '/cubee/');
insert into system_conf (conf_key,value) values ('WEBSOCKET_PORT', '3004');

insert into system_conf (conf_key,value) values ('WEBSOCKET_SSL_KEYSTORE_PATH','/opt/openfire/resources/security/keystore.wss');
insert into system_conf (conf_key,value) values ('WEBSOCKET_SSL_KEYSTORE_PASSWORD','password');
insert into system_conf (conf_key,value) values ('WEBSOCKET_SSL_PASSWORD', 'password');
insert into system_conf (conf_key,value) values ('WEBSOCKET_SSL_FLAG', '1');

