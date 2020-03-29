create role "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" with login password 'password';

grant all on database globalsns          to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on schema globalsns_manager    to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

grant all on cubee_system                to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on device_info_store           to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on device_info_store_id_seq    to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on shorten_uri_store           to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on shorten_uri_store_id_seq    to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on system_conf                 to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on tenant_store                to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on user_account_store          to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
grant all on user_account_store_id_seq   to "globalsns-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

