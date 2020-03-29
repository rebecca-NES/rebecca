#!/bin/bash

##
## ライセンスファイルの配置
##

cat <<EOF >  /var/lib/docker/volumes/opt_cubee_license_tenant/_data/${TENANT_UUID}.txt
${TENANT_LICENSE}
EOF



##
## 権限管理DBの設定ファイル追加
##

# 追加する情報を出力
cat <<EOF > /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json.adding.${TENANT_UUID}
{
  "rightctl_${TENANT_UUID}": {
    "db": "postgresql://${RIGHTCTL_USER}:${RIGHTCTL_PW}@${DATABASE_IPADDR}:5432/rightctl_${TENANT_UUID}",
    "opts": {
      "logging": false,
      "pool": {
        "acquire": 30000,
        "max": 50,
        "min": 1,
        "idle": 60000
      }
    }
  }
}
EOF

if [ ! -f /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json ]; then
  mv /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json.adding.${TENANT_UUID} \
    /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json

else
  # backup
  cp -p /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json \
    /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json.old.${NOWADAY}
  # マージする
  jq -s '.[0] * .[1]' \
    /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json.old.${NOWADAY} \
    /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json.adding.${TENANT_UUID} \
    > /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_rightctl_dbs.json

fi



##
## Openfire の設定ファイル作成
##

mkdir /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01

cat <<EOF >  /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01/openfire.xml
<?xml version="1.0" encoding="UTF-8"?>

<!--
    This file stores bootstrap properties needed by Openfire.
    Property names must be in the format: "prop.name.is.blah=value"
    That will be stored as:
        <prop>
            <name>
                <is>
                    <blah>value</blah>
                </is>
            </name>
        </prop>

    Most properties are stored in the Openfire database. A
    property viewer and editor is included in the admin console.
-->
<!-- root element, all properties must be under this element -->
<jive>
  <adminConsole>
    <!-- Disable either port by setting the value to -1 -->
    <port>9090</port>
    <securePort>9091</securePort>
  </adminConsole>
  <locale>en</locale>
  <!-- Network settings. By default, Openfire will bind to all network interfaces.
      Alternatively, you can specify a specific network interfaces that the server
      will listen on. For example, 127.0.0.1. This setting is generally only useful
       on multi-homed servers. -->
  <!--
    <network>
        <interface></interface>
    </network>
    -->
  <connectionProvider>
    <className>org.jivesoftware.database.DefaultConnectionProvider</className>
  </connectionProvider>
  <database>
    <defaultProvider>
      <driver>org.postgresql.Driver</driver>
      <serverURL>jdbc:postgresql://${DATABASE_IPADDR}:5432/openfire-${TENANT_UUID}-01</serverURL>
      <username>openfire-${TENANT_UUID}-01</username>
      <password>${POSTGRESQL_OPENFIRE_PW}</password>
      <testSQL>select 1</testSQL>
      <testBeforeUse>false</testBeforeUse>
      <testAfterUse>false</testAfterUse>
      <minConnections>5</minConnections>
      <maxConnections>25</maxConnections>
      <connectionTimeout>1.0</connectionTimeout>
    </defaultProvider>
  </database>
  <!-- ================
       Identity Reflecter 設定
       ================ -->
  <!--
  <ir>
    <ldap_enable>false</ldap_enable>
    <ldap>
      <host>ipa-spf</host>
      <port>389</port>
      <authCache>
        <enabled>true</enabled>
        <size>524288</size>
        <maxLifetime>7200000</maxLifetime>
      </authCache>
      <baseDN>cn=users,cn=accounts,dc=ipa;dc=test</baseDN>
      <usernameField>uid</usernameField>
    </ldap>
  </ir>
  -->
  <setup>true</setup>
  <spf>
    <USER_PROFILE_EXTRAS_DATA_MAX_BYTE>20971520</USER_PROFILE_EXTRAS_DATA_MAX_BYTE>
  </spf>
</jive>
EOF

cat <<'EOF' > /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01/log4j.xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE log4j:configuration SYSTEM "log4j.dtd">
<log4j:configuration xmlns:log4j="http://jakarta.apache.org/log4j/">

  <appender name="debug-out" class="org.apache.log4j.DailyRollingFileAppender">
    <param name="File" value="${openfireHome}/logs/debug.log" />
    <param name="DatePattern" value="'-'yyyyMMdd" />
    <param name="append" value="true" />
    <layout class="org.apache.log4j.PatternLayout">
      <param name="ConversionPattern" value="%d{yyyy.MM.dd HH:mm:ss} %c - %m%n" />
    </layout>
    <filter class="org.apache.log4j.varia.LevelRangeFilter">
      <param name="LevelMax" value="debug" />
      <param name="AcceptOnMatch" value="true" />
    </filter>
  </appender>

  <appender name="info-out" class="org.apache.log4j.DailyRollingFileAppender">
    <param name="File" value="${openfireHome}/logs/info.log" />
    <param name="DatePattern" value="'-'yyyyMMdd" />
    <param name="append" value="true" />
    <layout class="org.apache.log4j.PatternLayout">
      <param name="ConversionPattern" value="%d{yyyy.MM.dd HH:mm:ss} %c - %m%n" />
    </layout>
    <filter class="org.apache.log4j.varia.LevelRangeFilter">
      <param name="LevelMax" value="info" />
      <param name="LevelMin" value="info" />
      <param name="AcceptOnMatch" value="true" />
    </filter>
  </appender>

  <appender name="warn-out" class="org.apache.log4j.DailyRollingFileAppender">
    <param name="File" value="${openfireHome}/logs/warn.log" />
    <param name="DatePattern" value="'-'yyyyMMdd" />
    <param name="append" value="true" />
    <layout class="org.apache.log4j.PatternLayout">
      <param name="ConversionPattern" value="%d{yyyy.MM.dd HH:mm:ss} %c - %m%n" />
    </layout>
    <filter class="org.apache.log4j.varia.LevelRangeFilter">
      <param name="LevelMax" value="warn" />
      <param name="LevelMin" value="warn" />
      <param name="AcceptOnMatch" value="true" />
    </filter>
  </appender>

  <appender name="error-out" class="org.apache.log4j.DailyRollingFileAppender">
    <param name="File" value="${openfireHome}/logs/error.log" />
    <param name="DatePattern" value="'-'yyyyMMdd" />
    <param name="append" value="true" />
    <layout class="org.apache.log4j.PatternLayout">
      <param name="ConversionPattern" value="%d{yyyy.MM.dd HH:mm:ss} %c - %m%n" />
    </layout>
    <filter class="org.apache.log4j.varia.LevelRangeFilter">
      <param name="LevelMin" value="error" />
      <param name="AcceptOnMatch" value="true" />
    </filter>
  </appender>

  <!-- OF-506: Jetty INFO messages are generally not useful. Ignore them by default. -->
  <logger name="org.eclipse.jetty">
    <level value="warn" />
  </logger>

    <root>
    <level value="info" />
    <appender-ref ref="debug-out" />
    <appender-ref ref="info-out" />
    <appender-ref ref="warn-out" />
    <appender-ref ref="error-out" />
  </root>

</log4j:configuration>
EOF

cat <<EOF > /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01/db-globalsns_manager.properties
#DB driver
driverClassName=org.postgresql.Driver
#DB URL
url=jdbc:postgresql://${DATABASE_IPADDR}:5432/globalsns
#DB user
username=globalsns_admin
#DB password
password=${POSTGRESQL_GLOBALSNS_ADMIN_PW}
#initial connection count
initialSize=10
#max connection count
maxTotal=100
#max idle connection count
maxIdle=10
#get connection wait time
maxWait=1000
#validation SQL
validationQuery=select count(*)
EOF

cat <<EOF > /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01/db-globalsns.properties
#DB driver
driverClassName=org.postgresql.Driver
#DB URL
url=jdbc:postgresql://${DATABASE_IPADDR}:5432/globalsns
#DB user
username=globalsns-${TENANT_UUID}
#DB password
password=${POSTGRESQL_GLOBALSNS_PW}
#initial connection count
initialSize=10
#max connection count
maxTotal=150
#max idle connection count
maxIdle=10
#get connection wait time
maxWait=1000
#validation SQL
validationQuery=select count(*)
#tenantUUID
tenantUuid=${TENANT_UUID}
EOF

mkdir -p ${LOG_DIR}/spf-dckr-of-${TENANT_UUID}-01

## 所有者の変更
## ※docker コンテナ内のユーザと User IDを合わせる
chown -R 1000:1000 /var/lib/docker/volumes/opt_openfire_conf
chown -R 1000:1000 ${LOG_DIR}/spf-dckr-of-${TENANT_UUID}-01


##
## docker-compose.yml に追加
##

cat <<EOFEOF > ${BUILD_DIR}/compose/docker-compose.yml.add.${TENANT_UUID}-01
services:
  spf-dckr-of-${TENANT_UUID}-01:
    restart: always
    image: spf-of
    hostname: spf-dckr-of-${TENANT_UUID}-01
    container_name: spf-dckr-of-${TENANT_UUID}-01
    privileged: true
    volumes:
      - ${LOG_DIR}/spf-dckr-of-${TENANT_UUID}-01:/opt/openfire/logs
      - /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01:/opt/openfire/conf
      - /var/lib/docker/volumes/opt_openfire_conf/${TENANT_UUID}-01/log4j.xml:/opt/openfire/lib/log4j.xml
      - opt_cubee_cert:/opt/cubee/cert
    environment:
      - DBHOST=${DATABASE_IPADDR}
      - DBUSER=globalsns-${TENANT_UUID}
      - DBNAME=globalsns
      - DBPASSWORD=${POSTGRESQL_GLOBALSNS_PW}
    ports:
      - "${OPENFIRE_WEB_PORT}:9091"
    networks:
      - cubee-network

EOFEOF

# backup
cp -p ${BUILD_DIR}/compose/docker-compose.yml ${BUILD_DIR}/compose/docker-compose.yml.old.${NOWADAY}

# マージする
yq merge -i \
    ${BUILD_DIR}/compose/docker-compose.yml \
    ${BUILD_DIR}/compose/docker-compose.yml.add.${TENANT_UUID}-01



##
## Cubee Note DB用接続設定ファイル
##
cat > /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_globalsns_dbs.json <<EOF
{
    "${TENANT_UUID}": {
        "globalsns":{
            "db": "postgresql://globalsns-${TENANT_UUID}:password@${DATABASE_IPADDR}:5432/globalsns",
            "opts": {
                "logging": false,
                "pool": {
                    "acquire": 30000,
                    "max": 20,
                    "min": 1,
                    "idle": 60000
                },
                "operatorsAliases": false,
                "timezone": "+09:00"
            }
        }
    }
}
EOF

