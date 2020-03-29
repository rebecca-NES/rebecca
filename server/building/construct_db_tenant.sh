#!/bin/bash

##
## テナント追加時のDB作成
##

export PGHOST=${DATABASE_IPADDR}

cp -pr ${WORK_DIR}/postgres ${BUILD_DIR}

## Openfire DB
cd ${BUILD_DIR}/postgres/spf_openfire
/bin/bash init_for_openfire.sh -t ${TENANT_UUID} -p ${POSTGRES_PASSWORD} -a ${POSTGRESQL_OPENFIRE_PW} -c ${CUBEE_OPENFIRE_PW}

## Node.js DB
cd ${BUILD_DIR}/postgres/spf_nodejs
/bin/bash init_for_nodejs.sh -T ${TENANT_NAME} -t ${TENANT_UUID} -p ${POSTGRES_PASSWORD} -a ${POSTGRESQL_GLOBALSNS_ADMIN_PW} -b ${POSTGRESQL_GLOBALSNS_PW} -c ${CUBEE_OPENFIRE_PW} -s ${APNS_PASSPHRASE} -f ${TENANT_CONF} -A

## Rightctl
cd ${BUILD_DIR}/postgres/spf_rightctl/rightctl_initializer
pip install -r requirements.txt
cd ../
/bin/bash init_for_rightctl.sh -D ${DATABASE_IPADDR} -u ${TENANT_UUID} -a ${RIGHTCTL_USER} -p ${RIGHTCTL_PW} -P ${POSTGRES_PASSWORD}

