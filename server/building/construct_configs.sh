#!/bin/bash

##
## Docker が使うボリュームを準備し、設定ファイルなどを配置
##

##
## volume の作成
docker volume create --name=opt_cubee_cmnconf
docker volume create --name=opt_cubee_license_tenant
docker volume create --name=opt_cubee_node_conf
docker volume create --name=opt_cubee_node_data
docker volume create --name=opt_openfire_conf
docker volume create --name=opt_cubee_cert
docker volume create --name=etc_pki_tls

docker volume create --name=fluentd_etc
docker volume create --name=codimd_public_uploads
docker volume create --name=codimd-setting

##
## ファイルを配置
##
cat <<EOF >  /var/lib/docker/volumes/opt_cubee_cmnconf/_data/common.conf
SOCKET_IO_PORT=3000
REDIS_SERVER_HOST=spf-srvr-redis
REDIS_PORT=6379
REDIS_PW=${REDIS_PASSWORD}
DEFAULT_TENANT_NAME=${TENANT_NAME}
DEFAULT_TENANT_UUID=${TENANT_UUID}
REDIS_CONNECT_TIMEOUT=2000
REDIS_LOCK_TIMEOUT=5000
SYSTEM_LOCATION_ROOT=/cubee
KEEP_SESSION_DATA_TIME_AFTER_DISCONNECT=1800
REDIS_VOLATILE_SECONDS=60
REDIS_LOCK_CHEK_RETRY_MAX_CNT=10
REDIS_LOCK_CHEK_RETRY_INTERVAL=500
LOGIN_SEQUENCE_LOCK_RETRY_MAX_CNT=100
USER_PROFILE_EXTRAS_DATA_MAX_BYTE=20971520
ANALIZE_ACCSESS_PASSWORD=
OGP_CASH_TIME_LIFE=604800
OGP_USE_PROXY=
ENABLE_NOTE=${ENABLE_NOTE}
EOF

cat <<'EOF' >  /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_server_list
spf-dckr-nj-nginx-0001:8080
EOF

cat <<EOF >  /var/lib/docker/volumes/opt_cubee_cmnconf/_data/spf_server_list.outsidemap
spf-dckr-nj-nginx-0001,${HOST_IPADDRESS},3001
EOF

mkdir /var/lib/docker/volumes/opt_cubee_node_conf/spf-dckr-nj-0001

cat <<EOF >  /var/lib/docker/volumes/opt_cubee_node_conf/spf-dckr-nj-0001/server.conf
LOG_LEVEL=6
LOG_OUTPUT_TYPE=FILE
HTTP_PORT=3002
HTTPS_PORT=3003
HTTPS_SSL_CERTIFICATE_PATH=/etc/pki/tls/certs/server.crt
SOCKET_IO_PORT=3000
SOCKET_IO_SSL_PORT=3001
SOCKET_IO_SSL_CERTIFICATE_PATH=/etc/pki/tls/certs/server.crt
XMPP_SERVER_CLIENT_PORT=5222
XMPP_SERVER_NAME=localhost
XMPP_SERVER_ADMIN_ACCOUNT=admin
PRODUCT_NAME=Social Platform for the enterprise
GLOBAL_SNS_MANAGER_DB_SERVER_HOST=${DATABASE_IPADDR}
GLOBAL_SNS_MANAGER_DB_USER=globalsns_admin
GLOBAL_SNS_MANAGER_DB_PW=${POSTGRESQL_GLOBALSNS_ADMIN_PW}
NODEJS_HOSTNAME=spf-dckr-nj-0001:8080
SYSTEM_LOCATION_ROOT=/cubee
THUMBNAIL_HEIGHT=512
THUMBNAIL_WIDTH=512
THUMBNAIL_FILEPATH=thumbnail

HTTPS_SSL_CERTIFICATE_KEY_PATH=/etc/pki/tls/private/server.key
SOCKET_IO_SSL_CERTIFICATE_KEY_PATH=/etc/pki/tls/private/server.key
EOF

mkdir -p ${LOG_DIR}/spf-dckr-nj-0001/node

## 所有者の変更
## ※docker コンテナ内のユーザと User IDを合わせる
chown -R 1000:1000 /var/lib/docker/volumes
chown -R 1000:1000 ${LOG_DIR}


##
## logrotate 設定投入
##
cat <<EOF > /etc/logrotate.d/nginx
${LOG_DIR}/spf-dckr-px-0001/nginx/*.log
${LOG_DIR}/spf-dckr-nj-0001/nginx/*.log
{
    #
    # nginx
    #

    # No error when there is no file
    missingok

    # Do gzip
    compress

    # Everyday rotate and up to..
    daily rotate 397

    sharedscripts
    postrotate
        # Proxy
        PX_NGINX_PID=\`docker exec spf-dckr-px-nginx-0001 cat /var/run/nginx.pid\`
        docker exec spf-dckr-px-nginx-0001 kill -USR1 \$PX_NGINX_PID
        NJ_NGINX_PID=\`docker exec spf-dckr-nj-nginx-0001 cat /var/run/nginx.pid\`
        docker exec spf-dckr-nj-nginx-0001 kill -USR1 \$NJ_NGINX_PID
    endscript
}
EOF

cat <<EOF > /etc/logrotate.d/nodejs
${LOG_DIR}/spf-dckr-nj-0001/node/*.log
${LOG_DIR}/spf-dckr-px-0001/proxy/*.log
{
    #
    # Node.js (Cubee and Proxy)
    #

    # No error when there is no file
    missingok

    # Do gzip
    compress

    # Everyday rotate and up to..
    daily rotate 397

    # DO NOT use this cos some log will be lost
    # copytruncate

    sharedscripts
    postrotate
        PX_NODE_PID=\`docker exec spf-dckr-px-0001 ps -ef | grep node | awk '{print \$2}'\`
        docker exec spf-dckr-px-0001 kill -USR1 \$PX_NODE_PID
        NJ_NODE_PID=\`docker exec spf-dckr-nj-0001 ps -ef | grep node | awk '{print \$2}'\`
        docker exec spf-dckr-nj-0001 kill -USR1 \$NJ_NODE_PID
    endscript
}
EOF

cat <<EOF > /etc/logrotate.d/redis
${LOG_DIR}/spf-srvr-redis/redis.log {
    #
    # Redis
    #

    # No error when there is no file
    missingok

    # Do gzip
    compress

    # Everyday rotate and up to..
    daily rotate 397

    # DO NOT use this cos some log will be lost
    # copytruncate
}
EOF

##
## docker-compose ファイルの配置
## Openfireは後から足す
##

mkdir -p ${BUILD_DIR}/compose/

cat <<EOFEOF > ${BUILD_DIR}/compose/docker-compose.yml
version: '2'
services:
  spf-srvr-redis:
    restart: always
    image: redis:3.0.7
    hostname: spf-srvr-redis
    container_name: spf-srvr-redis
    volumes:
      - /var/lib/docker/volumes/usr_locall_etc/spf-srvr-redis/redis.conf:/usr/local/etc/redis.conf
      - ${LOG_DIR}/spf-srvr-redis:/data
    command: redis-server /usr/local/etc/redis.conf
    networks:
      - cubee-network

  spf-dckr-px-nginx-0001:
    restart: always
    image: spf-px-nginx
    hostname: spf-dckr-px-nginx-0001
    container_name: spf-dckr-px-nginx-0001
    volumes:
      - ${LOG_DIR}/spf-dckr-px-0001/nginx:/var/log/nginx
      ## 証明書の書き換えを行う際はコメントアウトを外すこと
      #- /var/lib/docker/volumes/etc_pki_tls/spf-dckr-px-0001:/etc/pki/tls
    ports:
      - 80:80
      - 443:443
    networks:
      - cubee-network

  spf-dckr-px-0001:
    restart: always
    image: spf-px
    hostname: spf-dckr-px-0001
    container_name: spf-dckr-px-0001
    volumes:
      - ${LOG_DIR}/spf-dckr-px-0001/proxy:/opt/cubee/proxy/logs
      - opt_cubee_cmnconf:/opt/cubee/cmnconf
    ports:
      - "3030:3030"
    networks:
      - cubee-network

  spf-dckr-nj-nginx-0001:
    restart: always
    image: spf-nj-nginx
    hostname: spf-dckr-nj-nginx-0001
    container_name: spf-dckr-nj-nginx-0001
    volumes:
    - ${LOG_DIR}/spf-dckr-nj-0001/nginx:/var/log/nginx
    ## 証明書の書き換えを行う際はコメントアウトを外すこと
    #  - /var/lib/docker/volumes/etc_pki_tls/spf-dckr-nj-0001:/etc/pki/tls
    ports:
      - 8080:8080
      - 8081:8081
    networks:
      - cubee-network

  spf-dckr-nj-0001:
    restart: always
    image: spf-nj
    hostname: spf-dckr-nj-0001
    container_name: spf-dckr-nj-0001
    volumes:
      - ${LOG_DIR}/spf-dckr-nj-0001/node:/opt/cubee/node/logs
      - opt_cubee_node_data:/opt/cubee/node/data
      - opt_cubee_license_tenant:/opt/cubee/license/tenant
      - opt_cubee_cmnconf:/opt/cubee/cmnconf
      - /var/lib/docker/volumes/opt_cubee_node_conf/spf-dckr-nj-0001:/opt/cubee/node/conf
      ## 証明書の書き換えを行う際はコメントアウトを外すこと
      # - /var/lib/docker/volumes/etc_pki_tls/spf-dckr-nj-0001:/etc/pki/tls
    environment:
      - DBHOST=${DATABASE_IPADDR}
      - DBUSER=${RIGHTCTL_USER}
      - DBNAME=rightctl_${TENANT_UUID}
      - DBPASSWORD=${RIGHTCTL_PW}
    ports:
      - "3001:3001"
    networks:
      - cubee-network

volumes:
  opt_cubee_cert:
    external:
      name: opt_cubee_cert
  opt_cubee_cmnconf:
    external:
      name: opt_cubee_cmnconf
  opt_cubee_node_data:
    external:
      name: opt_cubee_node_data
  opt_cubee_license_tenant:
    external:
      name: opt_cubee_license_tenant
  etc_pki_tls:
    external:
      name: etc_pki_tls

networks:
  cubee-network:
    external:
      name: cubee-network
EOFEOF

##
## ノート機能を利用しない場合、ここで処理終了
##

if ! "${ENABLE_NOTE}"; then
  exit 0
fi

##
## 以下、ノート機能向けファイルを構築
## docker-compose.yml に追加
##

cat <<EOFEOF > ${BUILD_DIR}/compose/docker-compose.yml.add.codimd
services:
  codimd_app:
    image: hackmdio/hackmd:1.2.1
    container_name: codimd_app
    hostname: codimd_app
    environment:
      - CMD_LOGLEVEL=info
      - CMD_URL_PATH=codimd
      - CMD_ALLOW_FREEURL=false
      - CMD_ALLOW_ANONYMOUS=false
      - CMD_ALLOW_ANONYMOUS_EDITS=false
      - CMD_DEFAULT_PERMISSION=limited
      - CMD_DB_URL=postgres://${CODIMD_DATABASE_USER}:${CODIMD_DATABASE_PASS}@${CODIMD_DB_SERVER_HOST}:${CODIMD_DB_SERVER_PORT}/${CODIMD_DATABASE_NAME}
      - CMD_EMAIL=true
      - CMD_ALLOW_EMAIL_REGISTER=true
      - CMD_IMAGE_UPLOAD_TYPE=filesystem
      - CMD_ALLOW_GRAVATAR=false
    ports:
       - "3000:3000"
    volumes:
      - /var/lib/docker/volumes/codimd_public_uploads:/codimd/public/uploads
      - /var/lib/docker/volumes/codimd-setting/conf:/files
      - /var/lib/docker/volumes/codimd-setting/index.body.ejs:/codimd/public/views/index/body.ejs
      - /var/lib/docker/volumes/codimd-setting/codimd.header.ejs:/codimd/public/views/codimd/header.ejs
      - /var/lib/docker/volumes/codimd-setting/shared.help-modal.ejs:/codimd/public/views/shared/help-modal.ejs
      - /var/lib/docker/volumes/codimd-setting/index.foot.ejs:/codimd/public/views/index/foot.ejs
      - /var/lib/docker/volumes/codimd-setting/codimd.body.ejs:/codimd/public/views/codimd/body.ejs
      - /var/lib/docker/volumes/codimd-setting/3.index.1d614f8b624f7d43819b.js:/codimd/public/build/3.index.1d614f8b624f7d43819b.js
    networks:
      - cubee-network
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
        tag: "docker.logging_driver.codimd"
    restart: always
    depends_on:
      - fluentd

  fluentd:
    image: fluent/fluentd:v1.4
    container_name: fluentd
    hostname: fluentd
    ports:
      - "24224:24224"
    environment:
      - "FLUENTD_CONF=fluentd.conf"
    volumes:
      - ${LOG_DIR}/fluentd_log:/fluentd/log
      - /var/lib/docker/volumes/fluentd_etc:/fluentd/etc
    networks:
      - cubee-network
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
        tag: "docker.logging_driver.codimd"

EOFEOF

# backup
cp -p ${BUILD_DIR}/compose/docker-compose.yml ${BUILD_DIR}/compose/docker-compose.yml.old.${NOWADAY}

# マージする
yq merge -i \
    ${BUILD_DIR}/compose/docker-compose.yml \
    ${BUILD_DIR}/compose/docker-compose.yml.add.codimd

##
## codimd用ログディレクトリ (fluentd でログを扱う)
##

mkdir -p ${LOG_DIR}/fluentd_log
chown 100.100 ${LOG_DIR}/fluentd_log

##
## fluentd設定ディレクトリ
##

#mkdir -p /var/lib/docker/volumes/fluentd_etc

##
## fluentd設定ファイル
##
cat > /var/lib/docker/volumes/fluentd_etc/fluentd.conf <<EOF
<source>
  @type  forward
  @id    input1
  @label @mainstream
  port  24224
</source>

<filter **>
  @type stdout
</filter>

<label @mainstream>
  <match docker.logging_driver.codimd>
    @type file
    @id   output_docker1
    path         /fluentd/log/docker.*.log
    append       true
    time_slice_format %Y%m%d
    time_slice_wait   10m
    time_format       %Y%m%dT%H%M%S%z
    compress gzip
  </match>
  <match **>
    @type file
    @id   output1
    path         /fluentd/log/data.*.log
    append       true
    time_slice_format %Y%m%d
    time_slice_wait   10m
    time_format       %Y%m%dT%H%M%S%z
    compress gzip
  </match>
</label>
EOF


##
## codimdアップロードファイルディレクトリ
##
#mkdir -p /var/lib/docker/volumes/codimd_public_uploads
chown 10000.65534 /var/lib/docker/volumes/codimd_public_uploads

##
## codimd設定ディレクトリ
##

mkdir -p /var/lib/docker/volumes/codimd-setting/conf

##
## codimd設定ファイル
##
cat > /var/lib/docker/volumes/codimd-setting/conf/.sequelizerc <<EOF
var path = require('path');

module.exports = {
    'config':          path.resolve('config.json'),
    'migrations-path': path.resolve('lib', 'migrations'),
    'models-path':     path.resolve('lib', 'models')
}
EOF

cat >  /var/lib/docker/volumes/codimd-setting/conf/config.json <<EOF
{
  "production": {
    "sessionLife": 31536000000
  }
}
EOF

##
cat docker/images/codimd/index.body.ejs > \
    /var/lib/docker/volumes/codimd-setting/index.body.ejs
cat docker/images/codimd/codimd.header.ejs > \
    /var/lib/docker/volumes/codimd-setting/codimd.header.ejs
cat docker/images/codimd/shared.help-modal.ejs > \
    /var/lib/docker/volumes/codimd-setting/shared.help-modal.ejs
cat docker/images/codimd/index.foot.ejs > \
    /var/lib/docker/volumes/codimd-setting/index.foot.ejs
cat docker/images/codimd/codimd.body.ejs > \
    /var/lib/docker/volumes/codimd-setting/codimd.body.ejs
cat docker/images/codimd/3.index.1d614f8b624f7d43819b.js > \
    /var/lib/docker/volumes/codimd-setting/3.index.1d614f8b624f7d43819b.js
