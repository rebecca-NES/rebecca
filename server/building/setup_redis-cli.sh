#!/bin/bash

##
## redis-cli
##

##
## ビルド

## 必要なモジュールをインストール
yum install -y wget gcc make

## redis のソースを取得する
cd /opt
wget http://download.redis.io/releases/redis-3.0.7.tar.gz

## make する
tar -xzvf redis-3.0.7.tar.gz
cd /opt/redis-3.0.7
make

## redis-cli を PATH が通っている場所に配置
cp -p src/redis-cli /usr/local/bin/
chmod 755 /usr/local/bin/redis-cli

## バージョン確認
redis-cli --version

