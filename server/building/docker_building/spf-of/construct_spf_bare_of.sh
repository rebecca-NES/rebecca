#!/bin/bash

##
## Docker Image の構築準備
##

## 公式のCentOSのイメージを取得
docker pull centos:centos6

## 構築作業用ディレクトリの用意
if [ -d ${BUILD_DIR}/spf_bare_of ]; then
    mv ${BUILD_DIR}/spf_bare_of ${BUILD_DIR}/spf_bare_of.${NOWADAY}
fi

mkdir -p ${BUILD_DIR}/spf_bare_of


## spf_bare_of の準備

cat <<'EOFEOF' > ${BUILD_DIR}/spf_bare_of/Dockerfile.bare
# Social Platform for the enterprise - OpenFire bare

# source
FROM       centos:centos6
ARG        http_proxy
ARG        https_proxy

# hostname will be set by docker run -h
RUN   sed -i -e "/^HOSTNAME/s/^HOSTNAME/#HOSTNAME/" /etc/sysconfig/network

# yum upgrade
RUN   echo "timeout=300" >> /etc/yum.conf && \
      echo "minrate=1" >> /etc/yum.conf   && \
      yum clean all && yum -y upgrade     && \
      yum -y install \
      initscripts \
      java-1.8.0-openjdk \
      upstart \
      postgresql.x86_64

# time zone change to jp
RUN   ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

# Disable mingetty
RUN   mv /etc/init/tty.conf /etc/init/tty.bk && \
      mv /etc/init/serial.conf /etc/init/serial.bk && \
      mv /etc/init/start-ttys.conf /etc/init/start-ttys.bk

# install openfire itself
ADD   openfire-3.8.2-1.i386.rpm /tmp/
RUN   yum -y install /tmp/openfire-3.8.2-1.i386.rpm
RUN   usermod -u 1000 daemon && groupmod -g 1000 daemon && chown -R daemon:daemon /opt/openfire
RUN   rm -rf /opt/openfire/conf /opt/openfire/logs
RUN   echo "export JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk.x86_64" >> /etc/sysconfig/openfire
RUN   sed -i -e '/^OPENFIRE_RUN_CMD=/s/ -classpath/ -Xms1g -Xmx1g -classpath/g' /etc/init.d/openfire
RUN   chkconfig openfire on

# create keystore file for Popup-Notification-App WebSocketSecure
RUN   /usr/bin/keytool  \
        -keystore /opt/openfire/resources/security/keystore.wss \
        -alias jetty    \
        -genkey         \
        -keyalg RSA     \
        -keysize 2048   \
        -validity 1825  \
        -dname "CN=, OU=, O=NEC Solution Innovators, L=, ST=, C=JP" \
        -storepass password \
        -keypass password
# create keystore file for https web console
RUN    /usr/bin/keytool \
         -keystore keystore.tmp \
         -alias spf-dckr-of_dsa \
         -genkey \
         -keyalg DSA \
         -validity 1825 \
         -dname "CN=spf-dckr-of" \
         -storepass changeit \
         -keypass changeit
RUN    /usr/bin/keytool \
         -keystore keystore.tmp \
         -alias spf-dckr-of_rsa \
         -genkey \
         -keyalg RSA \
         -keysize 2048 \
         -validity 1825 \
         -dname "CN=spf-dckr-of" \
         -storepass changeit \
         -keypass changeit
RUN    mv -f keystore.tmp /opt/openfire/resources/security/keystore && \
       chown daemon:daemon /opt/openfire/resources/security/keystore
ADD    truststore /opt/openfire/resources/security/

EXPOSE     3004 5222 5223 5229 5269 7070 7443 7777 9091
EOFEOF

# Proxy 設定がないならば、その記述を除去する
if [ ! -n "${https_proxy}" ]; then
  sed -ie "/^ARG        http_proxy/d" ${BUILD_DIR}/spf_bare_of/Dockerfile.bare
  sed -ie "/^ARG        https_proxy/d" ${BUILD_DIR}/spf_bare_of/Dockerfile.bare
fi

# truststore
cp -p ${WORK_DIR}/docker/images/spf_bare_of/truststore ${BUILD_DIR}/spf_bare_of/

# Openfire
if [ ! -f ${WORK_DIR}/docker/images/spf_bare_of/openfire-3.8.2-1.i386.rpm ]; then
  wget http://www.igniterealtime.org/downloadServlet?filename=openfire/openfire-3.8.2-1.i386.rpm -O ${WORK_DIR}/docker/images/spf_bare_of/openfire-3.8.2-1.i386.rpm
fi
cp -p ${WORK_DIR}/docker/images/spf_bare_of/openfire-3.8.2-1.i386.rpm ${BUILD_DIR}/spf_bare_of/


##
## ビルド
##
cd ${BUILD_DIR}/spf_bare_of
if [ ! -n "${https_proxy}" ]; then
  docker build -f ./Dockerfile.bare -t spf:centos6.of \
    --no-cache=true \
    .
else
  docker build -f ./Dockerfile.bare -t spf:centos6.of \
    --no-cache=true \
    --build-arg http_proxy=${http_proxy} \
    --build-arg https_proxy=${https_proxy} \
    .
fi
