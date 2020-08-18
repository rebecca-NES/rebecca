FROM node:6.11.4-slim
ARG http_proxy
ARG https_proxy
ARG NODE_TLS_REJECT_UNAUTHORIZED

## 証明書配置ディレクトリの作成
RUN mkdir /etc/pki /etc/pki/tls /etc/pki/tls/private /etc/pki/tls/certs

## 証明書を配置
ADD ./building/docker_building/tls/certs/server.crt /etc/pki/tls/certs/
ADD ./building/docker_building/tls/private/server.key /etc/pki/tls/private/

## ImageMagickのインストール
ADD ./building/docker_building/spf-nj/ImageMagick-7.0.7-25-make.tar.gz /
RUN apt update && \
    apt install -y build-essential && \
    ln -s /bin/sed /usr/bin/sed && \
    ln -s /bin/mkdir /usr/bin/mkdir && \
    cd /ImageMagick && \
    make install && \
    ldconfig /usr/local/lib && \
    rm -drf /ImageMagick && \
    apt remove -y build-essential

## ディレクトリを作成
WORKDIR /opt/cubee/node
RUN mkdir ../cmnconf ../license

## release媒体から、コードを配置
ADD ./release/node_src/ /opt/cubee/node/

## git, pythonがインストールに必要
RUN apt install -y git python

## 必要なライブラリインストール
RUN npm install

## git, python の削除
RUN apt remove -y git python

## nkf, postgresql-clientのインストール
RUN apt install -y nkf postgresql-client

## 実行スクリプトの配置
ADD ./building/docker_building/spf-nj/entry-point.sh /

## 実行スクリプトの配置
ADD ./building/docker_building/spf-nj/update_db.sh /opt/cubee/db_update/
ADD ./building/docker_building/spf-nj/rightctl_update.sql /opt/cubee/db_update/

## ポート空け、実行コマンドの設定
EXPOSE 3000 3001 3002 3003
CMD ["/entry-point.sh"]
