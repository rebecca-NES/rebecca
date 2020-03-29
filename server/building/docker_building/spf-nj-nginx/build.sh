#!/bin/bash

### build.shがあるディレクトリへ移動
cd $(dirname $0)

## システムロケーションルートの設定
if [ "${SYSTEM_LOCATION_ROOT}" == "" ]; then
  export SYSTEM_LOCATION_ROOT=cubee
fi

## 前回実行時のnginx設定ファイルの削除
rm -drf http*

## nginxコンフィグファイル上のルート設定書き換え
cp ./config/http* ./
sed -ie "s/SYSTEM_LOCATION_ROOT/${SYSTEM_LOCATION_ROOT}/g" ./http*

## release媒体配置箇所へ移動
cd ../../../

## dockerイメージのビルド
docker build -t spf-nj-nginx \
-f ./building/docker_building/spf-nj-nginx/Dockerfile . \
--no-cache=true
