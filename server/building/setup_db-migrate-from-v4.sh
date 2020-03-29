#!/bin/bash

##
## database の作成（v4からのマイグレーション）
##
mkdir -p ${BUILD_DIR}

if [ ! -d ${BUILD_DIR}/postgres ]; then
  cp -pr ${WORK_DIR}/postgres ${BUILD_DIR}
fi

if [ ! -f "/root/cubee-dev/db.tar.gz" ]; then
  echo "ERROR: there is no db.tar.gz file in /root/cubee-dev/"
  exit 1
fi

cd ${WORK_DIR}
tar xvzf /root/cubee-dev/db.tar.gz

if [ ! -f "${WORK_DIR}/db/db_globalsns.sql" ]; then
  echo "ERROR: there is no db_globalsns.sql file in ${WORK_DIR}/db/"
  exit 1
elif [ ! -f "${WORK_DIR}/db/db_globalsns_manager.sql" ]; then
  echo "ERROR: there is no db_globalsns_manager.sql file in ${WORK_DIR}/db/"
  exit 1
elif [ ! -f "${WORK_DIR}/db/db_globalsns_tsc.sql" ]; then
  echo "ERROR: there is no db_globalsns_tsc.sql file in ${WORK_DIR}/db/"
  exit 1
elif [ ! -f "${WORK_DIR}/db/db_of_create.sql" ]; then
  echo "ERROR: there is no db_of_create.sql file in ${WORK_DIR}/db/"
  exit 1
elif [ ! -f "${WORK_DIR}/db/db_of_data.sql" ]; then
  echo "ERROR: there is no db_of_data.sql file in ${WORK_DIR}/db/"
  exit 1
fi

export PGHOST=${DATABASE_IPADDR}

cd ${BUILD_DIR}/postgres/
MIGRATE_LOG="migrate.${NOWADAY}.log"
touch ${MIGRATE_LOG}

##
## Node.js DB
cd ${BUILD_DIR}/postgres/spf_nodejs
/bin/bash init_for_nodejs.sh -T ${TENANT_NAME} -t ${TENANT_UUID} -p ${POSTGRES_PASSWORD} -a ${POSTGRESQL_GLOBALSNS_ADMIN_PW} -b ${POSTGRESQL_GLOBALSNS_PW} -c ${CUBEE_OPENFIRE_PW} -s ${APNS_PASSPHRASE} -f ${TENANT_CONF}

# truncate first
export PGPASSWORD=${POSTGRESQL_GLOBALSNS_ADMIN_PW}
cat <<EOF > ${NOWADAY}.truncate_globalsns_admin.sql
truncate table system_conf                     ;
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns_admin globalsns -f ${NOWADAY}.truncate_globalsns_admin.sql >> ${MIGRATE_LOG}

# temporary altering
export PGPASSWORD=${POSTGRESQL_GLOBALSNS_ADMIN_PW}
cat <<EOF > ${NOWADAY}.alter_globalsns_before.sql
ALTER TABLE user_account_store ALTER COLUMN tenant_uuid SET DEFAULT '${TENANT_UUID}';
DELETE FROM user_account_store WHERE ID = 1;
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns_admin globalsns -f ${NOWADAY}.alter_globalsns_before.sql >> ${MIGRATE_LOG}

# insert globalsns_manager
export PGPASSWORD=${POSTGRESQL_GLOBALSNS_ADMIN_PW}
cp -p ${WORK_DIR}/db/db_globalsns_manager.sql ./${NOWADAY}.db_globalsns_manager.sql
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns_admin globalsns -f ${NOWADAY}.db_globalsns_manager.sql >> ${MIGRATE_LOG}

# fix temporary altering
cat <<EOF > ${NOWADAY}.alter_globalsns_after.sql
ALTER TABLE user_account_store ALTER COLUMN tenant_uuid DROP DEFAULT;
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns_admin globalsns -f ${NOWADAY}.alter_globalsns_after.sql >> ${MIGRATE_LOG}

# migrate data
cat <<EOF > ${NOWADAY}.migrate_globalsns_manager_data.sql
update device_info_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update user_account_store set    xmpp_server_name = 'spf-dckr-of-${TENANT_UUID}-01' where  xmpp_server_name = 'localhost';
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns_admin globalsns -f ${NOWADAY}.migrate_globalsns_manager_data.sql >> ${MIGRATE_LOG}


# truncate first
export PGPASSWORD=${POSTGRESQL_GLOBALSNS_PW}
cat <<EOF > ${NOWADAY}.truncate_globalsns.sql
truncate table tenant_system_conf              ;
truncate table chatroom_member_store           ;
truncate table chatroom_store                  ;
truncate table community_member_store          ;
truncate table community_store                 ;
truncate table follow_store                    ;
truncate table goodjob_store                   ;
truncate table mail_body_store                 ;
truncate table mail_cooperation_store          ;
truncate table mail_server_list                ;
truncate table message_sendto_list_store       ;
truncate table notification_store              ;
truncate table publicmessage_store             ;
truncate table read_message_date_store         ;
truncate table read_message_info_store         ;
truncate table tasknote_store                  ;
truncate table user_profile                    ;
truncate table cubee_system                    ;
truncate table device_info_store               ;
truncate table shorten_uri_store               ;
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns-${TENANT_UUID} globalsns -f ${NOWADAY}.truncate_globalsns.sql >> ${MIGRATE_LOG}

# insert globalsns-${TENANT_UUID}
cp -p ${WORK_DIR}/db/db_globalsns_tsc.sql ./${NOWADAY}.db_globalsns_tsc.sql
sed -ie "s/^SET search_path /-- SET search_path /g" ./${NOWADAY}.db_globalsns_tsc.sql
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns-${TENANT_UUID} globalsns -f ${NOWADAY}.db_globalsns_tsc.sql >> ${MIGRATE_LOG}

cp -p ${WORK_DIR}/db/db_globalsns.sql ./${NOWADAY}.db_globalsns.sql
sed -ie "s/^SET search_path /-- SET search_path /g" ./${NOWADAY}.db_globalsns.sql
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns-${TENANT_UUID} globalsns -f ${NOWADAY}.db_globalsns.sql >> ${MIGRATE_LOG}

# migrate data
cat <<EOF > ${NOWADAY}.migrate_globalsns_data.sql
update user_profile set photo_data = '${TENANT_UUID}/' || photo_data where photo_data like 'user%';
update community_store set logourl = '${TENANT_UUID}/' || logourl where logourl like 'comm%';
update chatroom_member_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update chatroom_member_store set    join_jid = regexp_replace(join_jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  join_jid is not null;
update chatroom_member_store set    leave_jid = regexp_replace(leave_jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  leave_jid is not null;
update chatroom_store set    created_by = regexp_replace(created_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  created_by is not null;
update chatroom_store set    updated_by = regexp_replace(updated_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  updated_by is not null;
update chatroom_store set    deleted_by = regexp_replace(deleted_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  deleted_by is not null;
update community_member_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update community_store set    created_by = regexp_replace(created_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  created_by is not null;
update community_store set    updated_by = regexp_replace(updated_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  updated_by is not null;
update community_store set    deleted_by = regexp_replace(deleted_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  deleted_by is not null;
update follow_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update follow_store set    follow_jid = regexp_replace(follow_jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update goodjob_store set    item_keeper_jid = regexp_replace(item_keeper_jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update goodjob_store set    gj_jid = regexp_replace(gj_jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update mail_body_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update mail_cooperation_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update mail_server_list set    created_by = regexp_replace(created_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  created_by is not null;
update mail_server_list set    updated_by = regexp_replace(updated_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  updated_by is not null;
update mail_server_list set    deleted_by = regexp_replace(deleted_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  deleted_by is not null;
update message_sendto_list_store set    send_to = regexp_replace(send_to, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update notification_store set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update notification_store set notification_data = regexp_replace(notification_data, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01', 'g') where notification_data like '%@localhost%';
update publicmessage_store set    msgfrom = regexp_replace(msgfrom, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update publicmessage_store set    msgto = regexp_replace(msgto, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update publicmessage_store set    reply_to = regexp_replace(reply_to, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  reply_to is not null;
update publicmessage_store set    mail_in_reply_to = regexp_replace(mail_in_reply_to, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  mail_in_reply_to is not null;
update publicmessage_store set    updated_by = regexp_replace(updated_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  updated_by is not null;
update publicmessage_store set    deleted_by = regexp_replace(deleted_by, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  deleted_by is not null;
update publicmessage_store set    msgto = 'spf-dckr-of-${TENANT_UUID}-01' where  msgto = 'localhost';
update publicmessage_store set    client = regexp_replace(client, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  client is not null;
update publicmessage_store set    owner = regexp_replace(owner, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where  owner is not null;
update user_profile set    jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns-${TENANT_UUID} globalsns -f ${NOWADAY}.migrate_globalsns_data.sql >> ${MIGRATE_LOG}


# cehck count
cat <<EOF > ${NOWADAY}.globalsns_count.sql
select count(*) from chatroom_member_store     ;
select count(*) from chatroom_store            ;
select count(*) from community_member_store    ;
select count(*) from community_store           ;
select count(*) from follow_store              ;
select count(*) from goodjob_store             ;
select count(*) from mail_body_store           ;
select count(*) from mail_cooperation_store    ;
select count(*) from mail_server_list          ;
select count(*) from message_sendto_list_store ;
select count(*) from notification_store        ;
select count(*) from publicmessage_store       ;
select count(*) from read_message_date_store   ;
select count(*) from read_message_info_store   ;
select count(*) from tasknote_store            ;
select count(*) from tenant_system_conf        ;
select count(*) from user_profile              ;
select count(*) from cubee_system              ;
select count(*) from device_info_store         ;
select count(*) from shorten_uri_store         ;
select count(*) from system_conf               ;
select count(*) from tenant_store              ;
select count(*) from user_account_store        ;
select count(*) from xmpp_server_store         ;
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U globalsns-${TENANT_UUID} globalsns -f ${NOWADAY}.globalsns_count.sql >> ${MIGRATE_LOG}


##
## Openfire
cd ${BUILD_DIR}/postgres/

# creating db and role
export PGPASSWORD=${POSTGRES_PASSWORD}
cat <<EOF > ${NOWADAY}.migrate_of_init.sql
create role "openfire-${TENANT_UUID}-01" with login password '${POSTGRESQL_OPENFIRE_PW}';
CREATE DATABASE "openfire-${TENANT_UUID}-01" WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'C' LC_CTYPE = 'C';
ALTER DATABASE "openfire-${TENANT_UUID}-01" OWNER TO "openfire-${TENANT_UUID}-01";
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U postgres -f ${NOWADAY}.migrate_of_init.sql >> ${MIGRATE_LOG}


# creating tables
export PGPASSWORD=${POSTGRES_PASSWORD}
cp -p ${WORK_DIR}/db/db_of_create.sql ./${NOWADAY}.db_of_create.sql
sed -ie "s/OWNER TO openfire/OWNER TO \"openfire-${TENANT_UUID}-01\"/g" ${NOWADAY}.db_of_create.sql
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U postgres openfire-${TENANT_UUID}-01 -f ${NOWADAY}.db_of_create.sql >> ${MIGRATE_LOG}

# insert data
export PGPASSWORD=${POSTGRESQL_OPENFIRE_PW}
cp -p ${WORK_DIR}/db/db_of_data.sql ./${NOWADAY}.db_of_data.sql
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U openfire-${TENANT_UUID}-01 openfire-${TENANT_UUID}-01 -f ${NOWADAY}.db_of_data.sql >> ${MIGRATE_LOG}

# migrate data
export PGPASSWORD=${POSTGRESQL_OPENFIRE_PW}
cat <<EOF > ${NOWADAY}.migrate_of_data.sql
update ofvcard set vcard = replace( vcard , '<BINVAL>user/', '<BINVAL>${TENANT_UUID}/user/') where vcard like '%<BINVAL>user/%';;
update ofpubsubaffiliation set jid = 'spf-dckr-of-${TENANT_UUID}-01' where jid = 'localhost';
update ofpubsubsubscription set jid = 'spf-dckr-of-${TENANT_UUID}-01' where jid = 'localhost';
update ofpubsubsubscription set owner = 'spf-dckr-of-${TENANT_UUID}-01' where owner = 'localhost';
update ofroster set jid = regexp_replace(jid, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01');
update ofoffline set stanza = regexp_replace(stanza, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01', 'g') where stanza like '%@localhost%';
update ofproperty set propvalue = 'spf-dckr-of-${TENANT_UUID}-01' where name = 'xmpp.domain';
update ofproperty set propvalue = regexp_replace(propvalue, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01', 'g') where name = 'admin.authorizedJIDs';
update ofsecurityauditlog set details = regexp_replace(details, '@localhost', '@spf-dckr-of-${TENANT_UUID}-01') where details like '%@localhost%';
update ofuser set email = 'admin@spf-dckr-of-${TENANT_UUID}-01' where email = 'admin@localhost';
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U openfire-${TENANT_UUID}-01 openfire-${TENANT_UUID}-01 -f ${NOWADAY}.migrate_of_data.sql >> ${MIGRATE_LOG}

# cehck count
cat <<EOF > ${NOWADAY}.of_count.sql
select count(*) from ofextcomponentconf             ;
select count(*) from ofgroup                        ;
select count(*) from ofgroupprop                    ;
select count(*) from ofgroupuser                    ;
select count(*) from ofid                           ;
select count(*) from ofmucaffiliation               ;
select count(*) from ofmucconversationlog           ;
select count(*) from ofmucmember                    ;
select count(*) from ofmucroom                      ;
select count(*) from ofmucroomprop                  ;
select count(*) from ofmucservice                   ;
select count(*) from ofmucserviceprop               ;
select count(*) from ofoffline                      ;
select count(*) from ofpresence                     ;
select count(*) from ofprivacylist                  ;
select count(*) from ofprivate                      ;
select count(*) from ofproperty                     ;
select count(*) from ofpubsubaffiliation            ;
select count(*) from ofpubsubdefaultconf            ;
select count(*) from ofpubsubitem                   ;
select count(*) from ofpubsubnode                   ;
select count(*) from ofpubsubnodegroups             ;
select count(*) from ofpubsubnodejids               ;
select count(*) from ofpubsubsubscription           ;
select count(*) from ofremoteserverconf             ;
select count(*) from ofroster                       ;
select count(*) from ofrostergroups                 ;
select count(*) from ofsaslauthorized               ;
select count(*) from ofsecurityauditlog             ;
select count(*) from ofuser                         ;
select count(*) from ofuserflag                     ;
select count(*) from ofuserprop                     ;
select count(*) from ofvcard                        ;
select count(*) from ofversion                      ;
EOF
echo "" >> ${MIGRATE_LOG}
date >> ${MIGRATE_LOG}
psql -a -U openfire-${TENANT_UUID}-01 openfire-${TENANT_UUID}-01 -f ${NOWADAY}.of_count.sql >> ${MIGRATE_LOG}


##
## Rightctl
cd ${BUILD_DIR}/postgres/spf_rightctl/rightctl_initializer
pip install -r requirements.txt
cd ../
/bin/bash init_for_rightctl.sh -D ${DATABASE_IPADDR} -u ${TENANT_UUID} -a ${RIGHTCTL_USER} -p ${RIGHTCTL_PW} -P ${POSTGRES_PASSWORD}

