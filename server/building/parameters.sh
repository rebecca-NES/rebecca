#!/bin/bash

##
## Parameters
##

## プロキシ設定（システム設定を引き継ぐ）
export http_proxy=${http_proxy}
export https_proxy=${https_proxy}
export no_proxy=${no_proxy}

## 作業用ディレクトリ、構築用ディレクトリ
export WORK_DIR=/root/cubee-dev/building/
export BUILD_DIR=/root/cubee/building/

## FrontendサーバのIPアドレス
export HOST_IPADDRESS=

## DBサーバのIPアドレス
export DATABASE_IPADDR=${HOST_IPADDRESS}

## PostgreSQL の postgres アカウントのパスワード
export POSTGRES_PASSWORD=password

## this is not editable
export POSTGRESQL_GLOBALSNS_ADMIN_PW=password
export POSTGRESQL_GLOBALSNS_PW=password
export POSTGRESQL_OPENFIRE_PW=password

## システム管理者のパスワード
export CUBEE_OPENFIRE_PW=password

## ログディレクトリ名とパス
export HOST_NAME=center
export LOG_DIR=/var/log/cubee/${HOST_NAME}/

## 初期構築テナント名、UUID、ライセンスの定義
export TENANT_NAME=spf
export TENANT_UUID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
export TENANT_LICENSE='QGX7R-R0034-809MJ-1G9FE'
export TENANT_CONF='{"disclosable":{"ldap":{"ldapEnable":false,"ldapUpdatable":false},"passwordPolicy":{"complexityNumber":32}}}'

## 初期構築テナントのOpenfire管理コンソールのポート
export OPENFIRE_WEB_PORT=5001

## this is not editable
export RIGHTCTL_USER=rightctl
export RIGHTCTL_PW=password
export REDIS_PASSWORD='password'
export APNS_PASSPHRASE='password'

## 作業日時の控え
export NOWADAY=`date '+%Y%m%d-%H%M%S'`

## release.zip のパス
export RELEASE_ZIP=/root/cubee-dev/release.zip

## for note setting
export ENABLE_NOTE=false
export CODIMD_DB_SERVER_HOST=${HOST_IPADDRESS}
export CODIMD_DB_SERVER_PORT=5432
export CODIMD_DATABASE_NAME=hackmd
export CODIMD_DATABASE_USER=codimd
export CODIMD_DATABASE_PASS=password

