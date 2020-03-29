FROM nginx
ARG http_proxy
ARG https_proxy

## 設定ファイルの配置
ADD ./building/docker_building/spf-nj-nginx/http.conf /etc/nginx/conf.d/
ADD ./building/docker_building/spf-nj-nginx/https.conf /etc/nginx/conf.d/

## 証明書配置ディレクトリの作成
RUN mkdir /etc/pki /etc/pki/tls /etc/pki/tls/private /etc/pki/tls/certs

## 証明書を配置
ADD ./building/docker_building/tls/certs/server.crt /etc/pki/tls/certs/
ADD ./building/docker_building/tls/private/server.key /etc/pki/tls/private/

## 静的HTMLファイルを配置
RUN mkdir /opt/cubee /opt/cubee/html
ADD ./release/web/ /opt/cubee/html/

## ポート空け
EXPOSE 8080 8081
