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

module.exports = function(sequelize) {

    var Sequelize = require('sequelize');

    return sequelize.define('user', {
        id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        user: {
            type: Sequelize.STRING(512),
            primaryKey: true
        },
        role_id : {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false
        },
        created_by: {
            type: Sequelize.STRING(512),
            allowNull: false
        },
        updated_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        updated_by: {
            type: Sequelize.STRING(512),
            allowNull: false,
            defaultValue: ''
        }
    }, {
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

};
