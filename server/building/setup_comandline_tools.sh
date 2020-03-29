#!/bin/bash

##
## YAML, JSON の操作コマンドラインプログラム のセットアップ
##

## yq の取得
## see: https://github.com/mikefarah/yq
wget https://github.com/mikefarah/yq/releases/download/1.14.0/yq_linux_386
mv yq_linux_386 /usr/local/bin/yq

## 権限更新
chmod 755 /usr/local/bin/yq

## バージョン確認
yq --version


## jq の取得
## see: https://stedolan.github.io/jq/download/
wget https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
mv jq-linux64 /usr/local/bin/jq

## 権限更新
chmod 755 /usr/local/bin/jq

## バージョン確認
jq --version

