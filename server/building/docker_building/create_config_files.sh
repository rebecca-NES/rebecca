#!/bin/bash

### build.shがあるディレクトリへ移動
cd $(dirname $0)

## 証明書配置先のディレクトリ生成
mkdir ./tls ./tls/certs ./tls/private

## 証明書の作成
openssl req -nodes -newkey rsa:2048              \
        -keyout ./tls/private/server.key      \
        -out    ./tls/certs/csr.csr           \
        -subj   "/C=JP/ST=/L=/O=NEC Solution Innovators/OU=/CN=localhost"

openssl x509 -req -days 1460                     \
        -in      ./tls/certs/csr.csr          \
        -signkey ./tls/private/server.key     \
        -out     ./tls/certs/server.crt

rm -f ./tls/certs/csr.csr
chmod 777 ./tls/certs/server.crt
chmod 777 ./tls/private/server.key
