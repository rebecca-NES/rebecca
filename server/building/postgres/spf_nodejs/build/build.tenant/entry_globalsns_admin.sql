set search_path to globalsns_manager;

insert into tenant_store (
    uuid
  , name
  , conf
  , update_time
  , delete_flg
) values (
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  , 'yyy'
  , 'TENANT_CONF_JSON'
  , CURRENT_TIMESTAMP
  , 0
);

insert into globalsns_manager.xmpp_server_store (
    server_name
  , tenant_uuid
  , update_time
  , delete_flg
) values (
    'spf-dckr-of-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xx'
  , 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  , CURRENT_TIMESTAMP
  , 0
);

insert into user_account_store (
      tenant_uuid
    , login_account
    , openfire_account
    , xmpp_server_name
    , mailaddress
    , update_time
    , delete_flg
) values (
      'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    , 'admin'
    , 'admin'
    , 'spf-dckr-of-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xx'
    , ''
    , now()
    , 0
);

