#!/bin/bash

### build.shがあるディレクトリへ移動
cd $(dirname $0)

## ノートの設定を見て、nginxの設定ファイルを配置
if "${ENABLE_NOTE}"; then
  cp ./config/enable_note/http* ./
else
  cp ./config/disable_note/http* ./
fi

## release媒体が配置箇所へ移動
cd ../../../

## dockerイメージのビルド
docker build -t spf-px-nginx \
-f ./building/docker_building/spf-px-nginx/Dockerfile . \
--no-cache=true
