/**
 * Authority DB handling error code definitions
 * @module  src/scripts/Auhority/db/db_error
 */

const DBError = {

    /**
     * Error code of scripts/Authority/db Invalid Argument
     * @type {Number}
     */
    DB_ERR_INVALID_ARG: 1001,
    /**
     * Error code of scripts/Authority/db Loading json is failed
     * @type {Number}
     */
    DB_ERR_LOADJSON_FAILED: 1002,
    /**
     * Error code of scripts/Authority/db Connecting DB is failed
     * @type {Number}
     */
    DB_ERR_CONNECT_FAILED: 1003,
    /**
     * Error code of scripts/Authority/db Not stored DB name
     * @type {Number}
     */
    DB_ERR_UNKNOWN_DB: 1004,
    /**
     * Error code of scripts/Authority/db Failed to query to DB
     * @type {Number}
     */
    DB_ERR_FAILED_QUERY: 1005,
    /**
     * Error code of scripts/Authority/db No record affected
     * @type {Number}
     */
    DB_ERR_RESULT_NONE: 1006,
    /**
     * Error code of scripts/Authority/db Loading json is invalid
     * @type {Number}
     */
    DB_ERR_INVALID_DEF: 1007

};

exports.DBError = DBError;
