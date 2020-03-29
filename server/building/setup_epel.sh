#!/bin/bash

##
## epel のセットアップ
##

yum install -y epel-release
sed -i -e "s/^enabled=1/enabled=0/g" /etc/yum.repos.d/epel.repo

yum install -y --enablerepo=epel python-pip
pip install crudini
