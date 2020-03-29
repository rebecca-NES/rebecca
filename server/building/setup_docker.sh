#!/bin/bash

##
## Docker のインストール
##

## ドッカーのリポジトリを yum に登録
touch /etc/yum.repos.d/docker.repo
cat <<'EOF' > /etc/yum.repos.d/docker.repo
[dockerrepo]
name=Docker Repository
baseurl=https://yum.dockerproject.org/repo/main/centos/$releasever/
enabled=1
gpgcheck=1
gpgkey=https://yum.dockerproject.org/gpg
EOF

## インストールしてバージョン確認
yum install -y docker-engine-1.12.6
docker -v

##
## 設定の配置、更新
cp -p /usr/lib/systemd/system/docker.service /etc/systemd/system/
crudini --set /etc/systemd/system/docker.service Service Environment "\"HTTP_PROXY=${http_proxy}\" \"HTTPS_PROXY=${https_proxy}\" \"NO_PROXY=${no_proxy},/var/run/docker.sock\""


## systemd に設定変更を把握させる
systemctl daemon-reload

##
## 起動
systemctl restart docker
systemctl enable docker
docker info


