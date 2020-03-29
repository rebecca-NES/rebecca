#!/bin/bash

##
## DockerCompose
##

##
## インストール

## docker-compose の取得
curl -L "https://github.com/docker/compose/releases/download/1.14.0/docker-compose-Linux-x86_64" -o docker-compose
mv docker-compose /usr/local/bin/docker-compose

## 権限更新
chmod +x /usr/local/bin/docker-compose

## バージョン確認
docker-compose --version

## Docker ブリッジネットワークを作成する。
docker network create -o --ip-masq=true -o --icc=true -o --ip="0.0.0.0" -o --mtu="1500" cubee-network
