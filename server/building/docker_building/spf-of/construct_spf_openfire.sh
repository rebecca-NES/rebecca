#!/bin/bash

##
## Docker Image の構築準備
##

# release.zip から解凍
if [ ! -d ${BUILD_DIR}/release.${NOWADAY} ]; then
  unzip ${RELEASE_ZIP} -d ${BUILD_DIR}/
  mv ${BUILD_DIR}/release ${BUILD_DIR}/release.${NOWADAY}
  cp -p ${RELEASE_ZIP} ${BUILD_DIR}/release.${NOWADAY}/
fi

## 構築作業用ディレクトリの用意
if [ -d ${BUILD_DIR}/spf_openfire ]; then
  # Docker Image（後半）構築ディレクトリをバックアップ
  tar cvzf ${BUILD_DIR}/release.${NOWADAY}/spf_openfire.tar.gz.${NOWADAY} ${BUILD_DIR}/spf_openfire
  # 旧ファイル/ディレクトリを削除
  rm -rf ${BUILD_DIR}/spf_openfire
fi

mkdir -p ${BUILD_DIR}/spf_openfire


## Prepare spf_openfire
cat <<'EOFEOF' > ${BUILD_DIR}/spf_openfire/Dockerfile
# Social Platform for the enterprise - OpenFire with Plugin

# source
FROM  spf:centos6.of
ARG   http_proxy
ARG   https_proxy

# hostname will be set by docker run -h
RUN   sed -i -e "/^HOSTNAME/s/^HOSTNAME/#HOSTNAME/" /etc/sysconfig/network

# put plugin
ADD   globalSNS.jar /opt/openfire/plugins/globalSNS.jar
RUN   chown daemon:daemon /opt/openfire/plugins/globalSNS.jar

# add entry-point.sh
RUN mkdir /etc/entry-point
ADD entry-point.sh /etc/entry-point
RUN chmod +x /etc/entry-point/entry-point.sh

EXPOSE     3004 5222 5223 5229 5269 7070 7443 7777 9090 9091
CMD ["/etc/entry-point/entry-point.sh"]
EOFEOF



# Proxy 設定がないならば、その記述を除去する
if [ ! -n "${https_proxy}" ]; then
  sed -ie "/^ARG        http_proxy/d" ${BUILD_DIR}/spf_openfire/Dockerfile
  sed -ie "/^ARG        https_proxy/d" ${BUILD_DIR}/spf_openfire/Dockerfile
fi

# CMD実行シェルの追加
cat <<'EOFEOF' > ${BUILD_DIR}/spf_openfire/entry-point.sh
#!/bin/sh

set -e

export PGPASSWORD="$DBPASSWORD"

until psql -h "$DBHOST" -U "$DBUSER" "$DBNAME" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"

cd /opt/openfire/logs
su -s /bin/bash - daemon -c "/usr/lib/jvm/jre-1.8.0-openjdk.x86_64/bin/java \
-server -DopenfireHome=/opt/openfire -Dopenfire.lib.dir=/opt/openfire/lib \
-Xms1g -Xmx1g -classpath /opt/openfire/lib/startup.jar \
-jar /opt/openfire/lib/startup.jar"
EOFEOF

# release.zip に含まれていたファイル/ディレクトリを配置
mv ${BUILD_DIR}/release.${NOWADAY}/globalSNS.jar ${BUILD_DIR}/spf_openfire

## イメージのビルド
cd ${BUILD_DIR}/spf_openfire
if [ ! -n "${https_proxy}" ]; then
  docker build -f ./Dockerfile -t spf-of \
  --no-cache=true \
    .
else
  docker build -f ./Dockerfile -t spf-of \
  --no-cache=true \
    --build-arg http_proxy=${http_proxy} \
    --build-arg https_proxy=${https_proxy} \
    .
fi
