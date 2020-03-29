FROM node:6.11.4-slim
ARG http_proxy
ARG https_proxy

## ディレクトリを作成
WORKDIR /opt/cubee/proxy
RUN mkdir ../cmnconf

## release媒体から、コードを配置
ADD ./release/proxy/ /opt/cubee/proxy/

## workdirを設定
WORKDIR /opt/cubee/proxy/scripts

## 必要なライブラリインストール
RUN npm install

## ポート空け、実行コマンドの設定
EXPOSE 3030
CMD ["node", "server.js"]
