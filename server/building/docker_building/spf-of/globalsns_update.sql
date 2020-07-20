-- フォロワー、フォロイーテーブル
CREATE TABLE IF NOT EXISTS user_follow_store
(
  id bigserial PRIMARY KEY,
  followee varchar(513) NOT NULL,
  follower varchar(513) NOT NULL,
  created_at   timestamp without time zone NOT NULL,
  UNIQUE(followee,follower)
);

-- テナント設定カラム情報
INSERT INTO tenant_system_conf (conf_key,value)
       SELECT 'SHOW_READ_INFO_MURMUR', 'true' WHERE NOT EXISTS
              (SELECT conf_key FROM tenant_system_conf WHERE conf_key='SHOW_READ_INFO_MURMUR');

-- つぶやきカラムテーブル
CREATE TABLE IF NOT EXISTS murmur_store
(
  id bigserial PRIMARY KEY,
  own_jid character varying(513) NOT NULL UNIQUE,
  column_name text NOT NULL DEFAULT '',
  created_at   timestamp without time zone NOT NULL,
  updated_at   timestamp without time zone
);
