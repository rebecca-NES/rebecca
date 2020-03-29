FROM nginx
ARG http_proxy
ARG https_proxy

## 設定ファイルの配置
ADD ./building/docker_building/spf-px-nginx/http.conf /etc/nginx/conf.d/
ADD ./building/docker_building/spf-px-nginx/https.conf /etc/nginx/conf.d/

## 証明書配置ディレクトリの作成
RUN mkdir /etc/pki /etc/pki/tls /etc/pki/tls/private /etc/pki/tls/certs

## 証明書を配置
ADD ./building/docker_building/tls/certs/server.crt /etc/pki/tls/certs/
ADD ./building/docker_building/tls/private/server.key /etc/pki/tls/private/

## ポート空け
EXPOSE 80 443
