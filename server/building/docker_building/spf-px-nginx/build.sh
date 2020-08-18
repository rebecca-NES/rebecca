#!/bin/bash

### build.shがあるディレクトリへ移動
cd $(dirname $0)


## システムロケーションルートの設定
if [ "${SYSTEM_LOCATION_ROOT}" == "" ]; then
  export SYSTEM_LOCATION_ROOT=rebecca
fi

## 前回実行時のnginx設定ファイルの削除
rm -drf http*

## ノートの設定を見て、nginxの設定ファイルを配置
if "${ENABLE_NOTE}"; then
  cp ./config/enable_note/http* ./
else
  cp ./config/disable_note/http* ./
fi

## nginxコンフィグファイル上のルート設定書き換え
sed -ie "s/SYSTEM_LOCATION_ROOT/${SYSTEM_LOCATION_ROOT}/g" ./http*

## release媒体が配置箇所へ移動
cd ../../../

## dockerイメージのビルド
docker build -t spf-px-nginx \
-f ./building/docker_building/spf-px-nginx/Dockerfile . \
--no-cache=true
