set search_path to globalsns_manager;

delete from cubee_system;
delete from system_conf where conf_key='GCM_API_KEY';
delete from system_conf where conf_key='SERVER_URL';
