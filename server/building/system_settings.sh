#!/bin/bash

##
## システム変更
##

## firewalld を停止
systemctl disable firewalld
systemctl stop firewalld

## ELinux を無効化
setenforce 0
sed -i -e 's/^SELINUX=enforcing/SELINUX=disabled/g' /etc/sysconfig/selinux

##
## ログを journald で扱うよう設定変更
cp -p /etc/systemd/journald.conf  /etc/systemd/journald.conf.org
sed -i -e 's/#SystemMaxUse=/SystemMaxUse=50M/g' /etc/systemd/journald.conf
