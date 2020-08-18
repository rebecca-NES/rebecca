#!/bin/bash

##
## Docker のインストール
##

## 必要なパッケージのインストール
yum install -y yum-utils device-mapper-persistent-data lvm2

## リポジトリの追加
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

## インストールしてバージョン確認
yum install -y docker-ce-19.03.12
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


