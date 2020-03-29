#!/bin/bash

##
## Create new openfire's database and its account script
##

##
## Default value
PG_NAME=`basename ${0}`
TENANT_UUID="aa944196-e5d5-11e5-84b4-000c29690167"
OPENFIRE_SERVER_NUM="01"
DEF_PASSWORD=password
P_PASSWORD=${DEF_PASSWORD}
A_PASSWORD=${DEF_PASSWORD}
C_PASSWORD=${DEF_PASSWORD}
NOWADAY=`date +"%Y%m%d-%I%M%S"`

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
  echo "  -t TENANT_UUID          : Tenant UUID (${TENANT_UUID} is default)"
  echo "  -n OPENFIRE_SERVER_NUM  : Number of openfire in a tenant (${OPENFIRE_SERVER_NUM} is default)"
  echo "  -p PASSWORD             : Password of postgres account"
  echo "  -a PASSWORD             : New password of openfire account for PostgreSQL"
  echo "  -c PASSWORD             : New password of cubee admin user"
  echo ""
}

##
## Managing arguments
while getopts t:n:p:a:c: opts
do
  case $opts in
    t)
      TENANT_UUID="$OPTARG"
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
    c)
      C_PASSWORD="$OPTARG"
      ;;
    *)
      usage
      exit
      ;;
  esac
done

##
## Check
if [ ! -e openfire.dmp ]; then
  echo "ERROR: openfire.dmp.org is missing"
  exit 1
fi

##
## Update parameters
OPENFIRE_SERVER_NUM=`printf "%02d" ${OPENFIRE_SERVER_NUM}`
OPENFIRE_DB_NM="openfire-${TENANT_UUID}-${OPENFIRE_SERVER_NUM}"
OPENFIRE_SV_NM="spf-dckr-of-${TENANT_UUID}-${OPENFIRE_SERVER_NUM}"

##
## Show arguments to user
echo "${PG_NAME}"
echo ""
echo "Now"
echo "  ${NOWADAY}"
echo ""
echo "Processing arguments.."
echo " new db/account name   : ${OPENFIRE_DB_NM}"
echo " new server name       : ${OPENFIRE_SV_NM}"
echo " new openfire password : ${A_PASSWORD}"
echo " new admin password    : ${C_PASSWORD}"
echo ""

##
## Prepare dmp file for execution
EX_SCHEMA="openfire-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xx"
EX_HOSTNM="localhost"
NEW_DMP="openfire.dmp.${NOWADAY}"

cp -p openfire.dmp ${NEW_DMP}
sed -i -e "s/${EX_SCHEMA}/${OPENFIRE_DB_NM}/g" ${NEW_DMP}
sed -i -e "s/${EX_HOSTNM}/${OPENFIRE_SV_NM}/g" ${NEW_DMP}

##
## Execution
echo "Executing.."

export PGPASSWORD=${P_PASSWORD}
psql -U postgres -c "create role \"${OPENFIRE_DB_NM}\" with login password '${A_PASSWORD}';"
psql -U postgres -c "grant \"${OPENFIRE_DB_NM}\" to postgres;"
psql -U postgres -c "create database \"${OPENFIRE_DB_NM}\" owner \"${OPENFIRE_DB_NM}\" encoding 'UTF8' TEMPLATE template0;"

export PGPASSWORD=${A_PASSWORD}
psql -U ${OPENFIRE_DB_NM} ${OPENFIRE_DB_NM} -f ${NEW_DMP}
psql -U ${OPENFIRE_DB_NM} ${OPENFIRE_DB_NM} -c "update ofuser set plainpassword='${C_PASSWORD}', encryptedpassword=null where username='admin'"

echo "  done!"
echo ""

exit

