#!/bin/bash

##
## Create nodejs's database and its account script
##

##
## Default value
PG_NAME=`basename ${0}`
TENANT_UUID="aa944196-e5d5-11e5-84b4-000c29690167"
TENANT_NAME="spf"
TENANT_CONF='{"disclosable":{"ldap":{"ldapEnable":false,"ldapUpdatable":false},"passwordPolicy":{"complexityNumber":32}}}'
OPENFIRE_SERVER_NUM="01"
DEF_PASSWORD=password
P_PASSWORD=${DEF_PASSWORD}
A_PASSWORD=${DEF_PASSWORD}
B_PASSWORD=${DEF_PASSWORD}
C_PASSWORD=${DEF_PASSWORD}
NEW_APNS_CERT_PW=#{DEF_PASSWORD}
PROXY_SV_NM="spf-dckr-px-0001"
NOWADAY=`date +"%Y%m%d-%I%M%S"`
ADD_TENANT="false"
#OS_VERSION=`cat /etc/redhat-release | cut -d" " -f3 | cut -d "." -f1`

##
## Usage
usage() {
  echo ""
  echo "Notice:"
  echo "  You have to use this script as postgres user."
  echo ""
  echo "Usage:"
  echo "  ${PG_NAME} -t TENANT_UUID -n OPENFIRE_SERVER_NUM -p PASSWORD -a PASSWORD"
  echo ""
  echo "Options:"
  echo "  -A                      : Add tenant"
  echo "  -t TENANT_UUID          : Tenant UUID (${TENANT_UUID} is default)"
  echo "  -T TENANT_NAME          : Tenant Name (${TENANT_NAME} is default)"
  echo "  -f TENANT_CONF          : TENANT_CONF"
  echo "  -n OPENFIRE_SERVER_NUM  : Number of openfire in a tenant (${OPENFIRE_SERVER_NUM} is default)"
  echo "  -p PASSWORD             : Password of postgres user"
  echo "  -a PASSWORD             : New password of globalsns_admin"
  echo "  -b PASSWORD             : New password of globalsns-<TENANT_UUID>"
  echo "  -c PASSWORD             : New password of cubee admin"
  echo "  -s PASSWORD             : APNs cert passphrase"
  echo ""
}

##
## Managing arguments
while getopts t:T:f:n:p:a:b:c:s:A opts
do
  case $opts in
    A)
      ADD_TENANT="true"
      ;;
    t)
      TENANT_UUID="$OPTARG"
      ;;
    T)
      TENANT_NAME="$OPTARG"
      ;;
    f)
      TENANT_CONF="$OPTARG"
      ;;
    n)
      OPENFIRE_SERVER_NUM="$OPTARG"
      ;;
    p)
      P_PASSWORD="$OPTARG"
      ;;
    a)
      A_PASSWORD="$OPTARG"
      ;;
    b)
      B_PASSWORD="$OPTARG"
      ;;
    c)
      C_PASSWORD="$OPTARG"
      ;;
    s)
      NEW_APNS_CERT_PW="$OPTARG"
      ;;
    *)
      usage
      exit
      ;;
  esac
done

##
## Check
if [ ! -d build ]; then
  echo "ERROR: build directory is missing"
  exit 1
fi


##
## Update parameters
OPENFIRE_SERVER_NUM=`printf "%02d" ${OPENFIRE_SERVER_NUM}`
OPENFIRE_SV_NM="spf-dckr-of-${TENANT_UUID}-${OPENFIRE_SERVER_NUM}"
NODEDB_USER_TN="globalsns-${TENANT_UUID}"

##
## Show arguments to user
echo "${PG_NAME}"
echo ""
echo "Now"
echo "  ${NOWADAY}"
echo ""
echo "Processing arguments.."
echo " openfire server name  : ${OPENFIRE_SV_NM}"
echo " proxy server name     : ${PROXY_SV_NM}"
echo " new db user for all   : glbaosns_admin (${A_PASSWORD})"
echo " new db user for tenant: ${NODEDB_USER_TN} (${B_PASSWORD})"
echo " new admin password    : ${C_PASSWORD}"
echo ""

##
## Prepare dmp file for execution
EX_HOSTNM="spf-dckr-of-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xx"
EX_TENANT="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
EX_TNAME="yyy"
EX_CONF="TENANT_CONF_JSON"
EX_A_PW="'password'"
EX_B_PW="'password'"
EX_C_PW="'PASSWORD'"
EX_ANPS_CERT_PW="'PASSWORD_FOR_APNS_CERT'"
NEW_BUILD_DIR="build.${NOWADAY}"

cp -prf build ${NEW_BUILD_DIR}

if [ "${ADD_TENANT}" == "false" ]; then
  sed -i -e "s/spf-dckr-px_0001/${PROXY_SV_NM}/g" ${NEW_BUILD_DIR}/build/create_table.sql
  sed -i -e "s/${EX_A_PW}/'${A_PASSWORD}'/g"      ${NEW_BUILD_DIR}/build/create_user.sql
  sed -i -e "s/${EX_ANPS_CERT_PW}/'${NEW_APNS_CERT_PW}'/g" ${NEW_BUILD_DIR}/build/entry.sql
fi
sed -i -e "s/${EX_B_PW}/'${B_PASSWORD}'/g"  ${NEW_BUILD_DIR}/build.tenant/create_user.sql
sed -i -e "s/${EX_TENANT}/${TENANT_UUID}/g" ${NEW_BUILD_DIR}/build.tenant/create_user.sql
sed -i -e "s/${EX_TENANT}/${TENANT_UUID}/g" ${NEW_BUILD_DIR}/build.tenant/create_table.sql

sed -i -e "s/${EX_HOSTNM}/${OPENFIRE_SV_NM}/g" ${NEW_BUILD_DIR}/build.tenant/entry_globalsns_admin.sql
sed -i -e "s/${EX_TENANT}/${TENANT_UUID}/g"    ${NEW_BUILD_DIR}/build.tenant/entry_globalsns_admin.sql
sed -i -e "s/${EX_TNAME}/${TENANT_NAME}/g"     ${NEW_BUILD_DIR}/build.tenant/entry_globalsns_admin.sql
sed -i -e "s/${EX_CONF}/${TENANT_CONF}/g"      ${NEW_BUILD_DIR}/build.tenant/entry_globalsns_admin.sql

sed -i -e "s/${EX_HOSTNM}/${OPENFIRE_SV_NM}/g" ${NEW_BUILD_DIR}/build.tenant/entry.sql
sed -i -e "s/${EX_C_PW}/'${C_PASSWORD}'/g"     ${NEW_BUILD_DIR}/build.tenant/entry.sql

#if [ "${OS_VERSION}" == "6" ]; then
#  sed -i -e "s/--\\i/\\i/" ${NEW_BUILD_DIR}/build/build.sql
#fi

##
## Execution
echo "Executing.."

cd ${NEW_BUILD_DIR}

## globalsns_manager
if [ "${ADD_TENANT}" == "false" ]; then
  export PGPASSWORD=${P_PASSWORD}
  psql -U postgres -f build/create_user.sql
  psql -U postgres -f build/create_database.sql

  # PostgreSQL 8.x
  # psql -U postgres -f /usr/share/pgsql/contrib/pgcrypto.sql

  # PostgreSQL 9.6
  psql -U postgres globalsns -c "CREATE EXTENSION pgcrypto;"

  export PGPASSWORD=${A_PASSWORD}
  psql -U globalsns_admin globalsns -f build/create_table.sql
  psql -U globalsns_admin globalsns -f build/entry.sql

fi

## globalsns_xx
export PGPASSWORD=${P_PASSWORD}
psql -U postgres globalsns -f build.tenant/create_user.sql

export PGPASSWORD=${B_PASSWORD}
psql -U "${NODEDB_USER_TN}" globalsns -f build.tenant/create_table.sql

export PGPASSWORD=${A_PASSWORD}
psql -U globalsns_admin globalsns -f build.tenant/entry_globalsns_admin.sql

export PGPASSWORD=${B_PASSWORD}
psql -U "${NODEDB_USER_TN}" globalsns -f build.tenant/entry.sql

echo "  done!"
echo ""

exit

