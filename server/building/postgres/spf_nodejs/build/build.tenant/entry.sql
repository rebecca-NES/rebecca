
insert into tenant_system_conf (conf_key,value) values ('SHOW_READ_INFO_PUBLIC', 'false');
insert into tenant_system_conf (conf_key,value) values ('SHOW_READ_INFO_CHAT', 'true');
insert into tenant_system_conf (conf_key,value) values ('SHOW_READ_INFO_GROUPCHAT', 'true');
insert into tenant_system_conf (conf_key,value) values ('SHOW_READ_INFO_COMMUNITY_FEED', 'true');
insert into tenant_system_conf (conf_key,value) values ('SHOW_READ_INFO_MAIL', 'false');
insert into tenant_system_conf (conf_key,value) values ('RECORD_READ_DATE_FLG', 'true');
insert into tenant_system_conf (conf_key,value) values ('CLIENT_PUSH_NOTIFICATION_KEEP_DAYS', '90');
insert into tenant_system_conf (conf_key,value) values ('CLIENT_PUSH_NOTIFICATION_MAX_COUNT', '100');
insert into tenant_system_conf (conf_key,value) values ('APNS_CERT_PASS', 'PASSWORD_FOR_APNS_CERT');
insert into tenant_system_conf (conf_key,value) values ('APNS_CERT_PATH', '/opt/cubee/cert/spfe-ios-cert.p12');
insert into tenant_system_conf (conf_key,value) values ('APNS_CERT_TYPE', 'PRODUCTION');


insert into user_profile (
      jid
    , mailaddress
    , password
    , name
    , nickname
    , presence
    , my_memo
    , photo_type
    , photo_data
    , update_time
    , delete_flg
    , affiliation
) values (
      'admin@spf-dckr-of-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xx'
    , ''
    , encode(digest('PASSWORD','sha256'),'hex')
    , 'admin'
    , 'admin'
    , 1
    , ''
    , ''
    , ''
    , now()
    , 0
    , '[]'
);


UPDATE tenant_store SET conf = jsonb_set(conf,'
{
     "disclosable","emotionPointBasicIcon"
}
','
{
    "0":"%E3%81%AA%E3%81%97",
    "1":"%E3%81%8A%E3%82%82%E3%81%97%E3%82%8D%E3%81%84%EF%BC%81",
    "2":"%E8%88%88%E5%91%B3%E6%B7%B1%E3%81%84%EF%BC%81",
    "3":"%E5%8F%82%E8%80%83%E3%81%AB%E3%81%AA%E3%82%8B%EF%BC%81",
    "4":"%E5%BD%B9%E3%81%AB%E7%AB%8B%E3%81%A4%EF%BC%81",
    "5":"%E5%8A%A9%E3%81%8B%E3%81%A3%E3%81%9F%EF%BC%81"
}
 ',true);


UPDATE tenant_store SET conf = jsonb_set(conf,'
{
     "disclosable","note"
}
','
{
    "enable":true
}
 ',true);

UPDATE tenant_store SET conf = jsonb_set(conf,'
{
     "disclosable","threadTitleCategory"
}
','
{
    "%E7%B7%8A%E6%80%A5":{"id":1,"bgColor":"#a00","color":"#fff"},
    "%E4%BE%9D%E9%A0%BC":{"id":2,"bgColor":"#0a0","color":"#fff"},
    "%E9%80%A3%E7%B5%A1":{"id":3,"bgColor":"#00a","color":"#fff"},
    "%E7%9B%B8%E8%AB%87":{"id":4,"bgColor":"#a0a","color":"#fff"},
    "%E5%85%B1%E6%9C%89":{"id":5,"bgColor":"#aa0","color":"#fff"}
}
 ',true);


CREATE VIEW thankspoint_counting AS SELECT
 sum(e.emotion_point) as points,
 p.msgfrom as jid,
 ua.login_account,
 date.date as updated_at
from
 publicmessage_store as p,
 emotion_store as e,
 user_account_store as ua,
 date_trunc('day',  (CASE WHEN e.updated_at is null THEN e.created_at ELSE e.updated_at END )) as date
where
 e.item_id = p.item_id AND
 p.msgfrom = ua.openfire_account || '@' || ua.xmpp_server_name AND
 ua.delete_flg = 0 AND
 e.jid != p.msgfrom
group by p.msgfrom,login_account,date.date
order by points
 desc;

CREATE VIEW goodjob_counting AS SELECT
 count(g.id) as points,
 p.msgfrom as jid,
 ua.login_account,
 date.date as updated_at
from
 publicmessage_store as p,
 goodjob_store as g,
 user_account_store as ua,
 date_trunc('day',  date) as date
where
  g.item_id = p.item_id AND
  p.msgfrom = ua.openfire_account || '@' || ua.xmpp_server_name AND
  ua.delete_flg = 0 AND
  g.gj_jid != p.msgfrom
group by p.msgfrom, login_account, date.date
order by points
 desc;

UPDATE tenant_store SET conf = jsonb_set(conf,'
{
     "disclosable","apiVersion"
}','"5.11.1"',true);
