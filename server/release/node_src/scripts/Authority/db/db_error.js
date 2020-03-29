/*
Copyright 2020 NEC Solution Innovators, Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const DBError = {

    DB_ERR_INVALID_ARG: 1001,
    DB_ERR_LOADJSON_FAILED: 1002,
    DB_ERR_CONNECT_FAILED: 1003,
    DB_ERR_UNKNOWN_DB: 1004,
    DB_ERR_FAILED_QUERY: 1005,
    DB_ERR_RESULT_NONE: 1006,
    DB_ERR_INVALID_DEF: 1007

};

exports.DBError = DBError;
