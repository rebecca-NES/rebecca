#!/bin/bash

##
## Create rightctl's database and its account script
##

##
## Default value
PG_NAME=`basename ${0}`
NOWADAY=`date +"%Y%m%d-%I%M%S"`

TARGET_DATA="cubee"
SYSTEM_UUID="aa944196-e5d5-11e5-84b4-000c29690167"
DB_HOST="localhost"
NEW_DB_NAME="rightctl_${SYSTEM_UUID}"
JSON_INITDATA="rightctl_${TARGET_DATA}.json"
NEW_DB_ACCOUNT="rightctl"
NEW_DB_PASSWORD="password"
DB_ACCOUNT="postgres"
DB_PASSWORD="password"

##
## Usage
usage() {
  echo ""
  echo "Notice:"
  echo "  You have to use this script as postgres user."
  echo ""
  echo "Usage:"
  echo "  ${PG_NAME} -D DB_HOST -d TENANT_NAME -a NEW_DB_ACCOUNT -p NEW_DB_PASSWORD -P DB_PASSWORD -i JSON_INITDATA"
  echo ""
  echo "Options:"
  echo "  -D DB_HOST              : Database host name of IP-addres"
  echo "  -u NEW_SYSTEM_UUID      : UUID of new system that using rightctl database"
  echo "  -a NEW_DB_ACCOUNT       : New database's account name"
  echo "  -p NEW_DB_PASSWORD      : Password for new database's account"
  echo "  -P DB_PASSWORD          : postgres user's password"
  echo "  -i JSON_INITDATA        : Json file of init rightctl data"
  echo ""
}

##
## Managing arguments
while getopts D:u:a:p:P:i: opts
do
  case $opts in
    D)
      DB_HOST="${OPTARG}"
      ;;
    u)
      NEW_DB_NAME="rightctl_${OPTARG}"
      ;;
    a)
      NEW_DB_ACCOUNT="${OPTARG}"
      ;;
    p)
      NEW_DB_PASSWORD="${OPTARG}"
      ;;
    P)
      DB_PASSWORD="${OPTARG}"
      ;;
    i)
      JSON_INITDATA="${OPTARG}"
      ;;
    *)
      usage
      exit
      ;;
  esac
done

##
## Show arguments to user
echo "${PG_NAME}"
echo ""
echo "Now"
echo "  ${NOWADAY}"
echo ""
echo "Processing arguments.."
echo "  DB_HOST              : ${DB_HOST}"
echo "  NEW_DB_NAME          : ${NEW_DB_NAME}"
echo "  NEW_DB_ACCOUNT       : ${NEW_DB_ACCOUNT}"
echo "  NEW_DB_PASSWORD      : ${NEW_DB_PASSWORD}"
echo "  DB_ACCOUNT           : ${DB_ACCOUNT}"
echo "  DB_PASSWORD          : ${DB_PASSWORD}"
echo "  TARGET_DATA          : ${TARGET_DATA}"
echo "  JSON_INITDATA        : ${JSON_INITDATA}"
echo ""

##
## Check
if [ ! -e ${JSON_INITDATA} ]; then
  echo "ERROR: ${JSON_INITDATA} is missing"
  exit 1
fi

##
## Prepare dmp file for execution
NEW_JSON="${JSON_INITDATA}.${NEW_DB_NAME}.${NOWADAY}"

cp -p ${JSON_INITDATA} ${NEW_JSON}
sync

##
## Execution
echo "Executing.."
export PGPASSWORD=${DB_PASSWORD}

if [ "${TARGET_DATA}" == "cubee" ]; then

  psql -U postgres -h ${DB_HOST} -c "create role \"${NEW_DB_ACCOUNT}\" with login password '${NEW_DB_PASSWORD}';"
  psql -U postgres -h ${DB_HOST} -c "grant \"${NEW_DB_ACCOUNT}\" to postgres;"
  psql -U postgres -h ${DB_HOST} -c "create database \"${NEW_DB_NAME}\" owner \"${NEW_DB_ACCOUNT}\" encoding 'UTF8' TEMPLATE template0;"

  cd rightctl_initializer
  python main.py -d postgres://${NEW_DB_ACCOUNT}:${NEW_DB_PASSWORD}@${DB_HOST}:5432/${NEW_DB_NAME} -i ../${NEW_JSON}

fi

echo "  done!"
echo ""

exit
