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

function generateModels(con) {

    var _models = {};

    _models.Translation = require('./translation')(con);
    _models.Role = require('./role')(con);
    _models.Right = require('./right')(con);
    _models.Policy = require('./policy')(con);
    _models.User = require('./user')(con);


    _models.Policy.belongsToMany(
        _models.Right,
        {
            through: 'policy_has_rights',
            timestamps: false
        }
    );
    _models.Right.belongsToMany(
        _models.Policy,
        {
            through: 'policy_has_rights',
            timestamps: false
        }
    );

    _models.Role.belongsToMany(
        _models.Policy,
        {
            through: 'role_has_policies',
            timestamps: false
        }
    );
    _models.Policy.belongsToMany(
        _models.Role,
        {
            through: 'role_has_policies',
            timestamps: false
        }
    );

    _models.User.belongsTo(_models.Role);

    _models.User.belongsToMany(
        _models.Policy,
        {
            through: 'user_has_policies',
            foreignKey: 'user_id',
            timestamps: false
        }
    );
    _models.Policy.belongsToMany(
        _models.User,
        {
            through: 'user_has_policies',
            otherKey: 'user_id',
            timestamps: false
        }
    );

    _models.Role.hasMany(
        _models.Translation,
        {
            foreignKey: 'id',
            sourceKey: 'role_tid'
        }
    );

    _models.Policy.hasMany(
        _models.Translation,
        {
            foreignKey: 'id',
            sourceKey: 'policy_tid'
        }
    );

    return _models;
}

exports.generateModels = generateModels;
