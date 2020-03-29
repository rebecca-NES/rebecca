#!/bin/bash

### build.shがあるディレクトリへ移動
cd $(dirname $0)

### release.zip配置箇所へ移動
cd ../../../

### ビルド実行
if [ ! -n "${https_proxy}" ]; then
  echo "build on no proxy"
  docker build -t spf-nj -f ./building/docker_building/spf-nj/Dockerfile . \
  --build-arg NODE_TLS_REJECT_UNAUTHORIZED=0 \
  --no-cache=true
else
  echo "build on using proxy"
  docker build -t spf-nj -f ./building/docker_building/spf-nj/Dockerfile . \
  --build-arg http_proxy=${http_proxy} \
  --build-arg https_proxy=${https_proxy} \
  --build-arg NODE_TLS_REJECT_UNAUTHORIZED=0 \
  --no-cache=true
fi
