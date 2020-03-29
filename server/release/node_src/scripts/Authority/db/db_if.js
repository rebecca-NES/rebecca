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

var _ = require('underscore');
var Op = require('sequelize').Op;
var QueryTypes = require('sequelize').QueryTypes;
var DBError = require('./db_error').DBError;
var DBConnector = require('./db_connector');
var _log = require('../log').returnLogFunction();

function DBIF() {
    this.dbConnector = DBConnector.getInstance();
}

function create() {
    return new DBIF();
}

DBIF.prototype.initialize = function(confFilePath, cb) {
    if (confFilePath == null || typeof confFilePath != "string") {
        _log.connectionLog(3, 'DBIF::initialize(), Invalid argument of confFilePath');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBIF::initialize(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    _log.connectionLog(7, 'DBIF::initialize');

    _self.dbConnector.stayConnecting(confFilePath, function (err) {
        if (err) {
            _log.connectionLog(3, 'DBIF::initialize(), DBConnector.stayConnecting() result with error: ' + JSON.stringify(err));
            process.nextTick(function() {
                cb(err);
            });
            return;
        }
        _log.connectionLog(7, 'DBIF::initialize(), dbConnector.stayConnecting success');
        process.nextTick(function() {
            cb();
        });
    });

};

DBIF.prototype.getDbName = function(system_uuid) {
    if (system_uuid == null || typeof system_uuid != 'string') {
        _log.connectionLog(3, 'DBIF::getDbName(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    return "rightctl_" + system_uuid;
};

DBIF.prototype.getRoles = function(system_uuid, cb) {
    if (system_uuid == null || typeof system_uuid != "string") {
        _log.connectionLog(3, 'DBIF::getRoles(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBIF::getRoles(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::getRoles');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};

    _dbCon.models.role.findAll( { order: [['id', 'ASC']] } )
    .then(function(roles) {

        var _len = roles.length;
        var _role_tids = [];
        for (var idx = 0; idx < _len; idx++) {
            _res[roles[idx].id] = {
                id: roles[idx].id,
                role_tid: roles[idx].role_tid,
                created_at: roles[idx].created_at,
                created_by: roles[idx].created_by,
                updated_at: roles[idx].updated_at,
                updated_by: roles[idx].updated_by
            };
            _role_tids[idx] = roles[idx].role_tid;
        }

        return _dbCon.models.translation.findAll({
            where: {
                id: {
                    [Op.in]: _role_tids
                },
                locale: {
                    [Op.eq]: 'ja'
                }
            }
        });
    })
    .then(function(t) {

        var _len = t.length;
        for (var idx = 0; idx < _len; idx++) {
            var _role = _.where(_res, { role_tid: t[idx].id })[0];
            if (_role) {
                _role.t = _role.t || {};
                _role.t[t[idx].locale] = t[idx].t;
                _res[_role.id] = _role;
            }
        }

        _log.connectionLog(7, 'DBIF::getRoles() success: ' + _res);
        process.nextTick(function() {
            cb(null, _res);
        });

    })
    .catch(function(errors) {
        _log.connectionLog(3, 'DBIF::getRoles(), DB access result failed: ' + errors);
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::getRoles failed query to dbName: ' + _dbName + ', err: ' + errors});
        });
    });

};

DBIF.prototype.getPolicies = function(system_uuid, cb) {
    if (system_uuid == null || typeof system_uuid != "string") {
        _log.connectionLog(3, 'DBIF::getPolicies(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBIF::getPolicies(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::getPolicies');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};

    _dbCon.models.policy.findAll()
    .then(function(policies) {

        var _len = policies.length;
        var _policy_tids = [];
        for (var idx = 0; idx < _len; idx++) {
            _res[policies[idx].id] = {
                id: policies[idx].id,
                policy_tid: policies[idx].policy_tid,
                created_at: policies[idx].created_at,
                created_by: policies[idx].created_by,
                updated_at: policies[idx].updated_at,
                updated_by: policies[idx].updated_by
            };
            _policy_tids[idx] = policies[idx].policy_tid;
        }

        return _dbCon.models.translation.findAll({
            where: {
                id: {
                    [Op.in]: _policy_tids
                },
                locale: {
                    [Op.eq]: 'ja'
                }
            }
        });
    })
    .then(function(t) {

        var _len = t.length;
        for (var idx = 0; idx < _len; idx++) {
            var _policy = _.where(_res, { policy_tid: t[idx].id })[0];
            if (_policy) {
                _policy.t = _policy.t || {};
                _policy.t[t[idx].locale] = t[idx].t;
                _res[_policy.id] = _policy;
            }
        }

        _log.connectionLog(7, 'DBIF::getPolicies() success: ' + _res);
        process.nextTick(function() {
            cb(null, _res);
        });

    })
    .catch(function(errors) {
        _log.connectionLog(3, 'DBIF::getPolicies(), DB access result failed: ' + errors);
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::getPolicies failed query to dbName: ' + _dbName + ', err: ' + errors});
        });
    });

};

DBIF.prototype.getPoliciesOfRole = function(system_uuid, roleId, cb) {
    if (system_uuid == null || typeof system_uuid != "string") {
        _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (roleId == null || typeof roleId != "string") {
        _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), Invalid argument of roleId');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::getPoliciesOfRole');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};
    var _role = null;

    _dbCon.models.role.findOne( { where: { id: roleId } } )
    .then(function(role) {
        if (!role) {
            _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), findeOne return zero: ' + roleId);
            throw 'ERROR: DBIF::getPoliciesOfRole there is no such role: ' + roleId;
        }

        _role = role;
        _res[_role.id] = {
            id: _role.id,
            role_tid: _role.role_tid,
            created_at: _role.created_at,
            created_by: _role.created_by,
            updated_at: _role.updated_at,
            updated_by: _role.updated_by
        };

        return _dbCon.models.translation.findAll({
            where: {
                id: {
                    [Op.eq]: _role.role_tid
                },
                locale: {
                    [Op.eq]: 'ja'
                }
            }
        });

    })
    .then(function(t) {
        if (!t) {
            _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), translation findAll return zero: ' + _role.role_tid);
            throw 'ERROR: DBIF::getPoliciesOfRole translation.findAll failed. dbName: ' + _dbName;
        }
        var _len = t.length;
        for (var i=0; i < _len; i++) {
            _res[_role.id].t = _res[_role.id].t || {};
            _res[_role.id].t[t[i].locale] = t[i].t;
        }
    })
    .then(function() {
        return _role.getPolicies();

    })
    .then(function(p) {
        if (!p) {
            _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), getPolicies return zero: ' + _role.id);
            throw 'ERROR: DBIF::getPoliciesOfRole getPolicies() failed. dbName: ' + _dbName;
        }

        var _promises = [];

        p.forEach(function(ep) {
            _res[_role.id].policies =  _res[_role.id].policies || {};
            _res[_role.id].policies[ep.id] = {
                id: ep.id,
                policy_tid: ep.policy_tid,
                created_at: ep.created_at,
                created_by: ep.created_by,
                updated_at: ep.updated_at,
                updated_by: ep.updated_by
            };

            _promises.push(
                Promise.all([
                    _dbCon.models.translation.findAll({
                        where: {
                            id: {
                                [Op.eq]: ep.policy_tid
                            },
                            locale: {
                                [Op.eq]: 'ja'
                            }
                        }
                    }),
                    ep.getRights()
                ])
                .then(function(results) {
                    if (!results || !results[0]) {
                        _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), policies translation findAll return zero: ' + ep.id);
                        throw {code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::getPoliciesOfRole translation() failed. dbName: ' + _dbName};
                    }
                    if (!results[1]) {
                        _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), policies getRights return zero: ' + ep.id);
                        throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::getPoliciesOfRole getRights() failed. dbName: ' + _dbName};
                    }
                    var t = results[0];
                    for (var i=0; i < t.length; i++) {
                        _res[_role.id].policies[ep.id].t = _res[_role.id].policies[ep.id].t || {};
                        _res[_role.id].policies[ep.id].t[t[i].locale] = t[i].t;
                    }
                    var r = results[1];
                    for (var j=0; j < r.length; j++) {
                        var _r = r[j];
                        _res[_role.id].policies[ep.id].rights = _res[_role.id].policies[ep.id].rights || {};
                        _res[_role.id].policies[ep.id].rights[_r.action] = _r.enable_flag;
                    }

                })
            );

        });

        return Promise.all(_promises);

    })
    .then(function() {
        _log.connectionLog(7, 'DBIF::getPoliciesOfRole() success: ' + _res);
        process.nextTick(function() {
            cb(null, _res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            cb(errors);
        } else {
            _log.connectionLog(3, 'DBIF::getPoliciesOfRole(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::getPoliciesOfRole failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};

DBIF.prototype.getUserRole = function(system_uuid, userID, cb) {
    if (system_uuid == null || typeof system_uuid != "string") {
        _log.connectionLog(3, 'DBIF::getUserRole(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (userID == null || typeof userID != "string") {
        _log.connectionLog(3, 'DBIF::getUserRole(), Invalid argument of userID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBIF::getUserRole(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::getUserRole');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};
    var _user = null;
    var _role = null;

    _dbCon.models.user.findOne( { where: { user: userID } } )
    .then(function(user) {
        if (user == null) {
            _log.connectionLog(6, 'DBIF::getUserRole(), findeOne return zero: ' + userID);
            throw {code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::getUserRole there is no such user_id: ' + userID};
        }

        _user = user;
        _res[_user.user] = _.pick(
            _user,
            'id',
            'user',
            'role_id',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );

        return _dbCon.models.role.findOne( { where: { id: _user.role_id} } );

    })
    .then(function(role) {
        if (role == null) {
            _log.connectionLog(3, 'DBIF::getUserRole(), role.findeOne return zero: ' + _user.role_id);
            throw 'ERROR: DBIF::getUserRole there is no such role: ' + _user.role_id;
        }

        _role = role;
        _res[_user.user].role = _.pick(
            _role,
            'id',
            'role_tid',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );

        return _dbCon.models.translation.findAll({
            where: {
                id: {
                    [Op.eq]: _role.role_tid
                },
                locale: {
                    [Op.eq]: 'ja'
                }
            }
        });

    })
    .then(function(t) {
        if (!t) {
            _log.connectionLog(3, 'DBIF::getUserRole(), translation findAll return zero: ' + _role.role_tid);
            throw 'ERROR: DBIF::getUserRole translation.findAll failed. role_tid: ' + _role.role_tid;
        }
        var _len = t.length;
        for (var i=0; i < _len; i++) {
            _res[_user.user].role.t = _res[_user.user].role.t || {};
            _res[_user.user].role.t[t[i].locale] = t[i].t;
        }
    })
    .then(function() {
        _log.connectionLog(7, 'DBIF::getUserRole() success: ' + _res);
        process.nextTick(function() {
            cb(null, _res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            process.nextTick(function() {
                cb(errors);
            });
        } else {
            _log.connectionLog(3, 'DBIF::getUserRole(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::getUserRole failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};

DBIF.prototype.upsertUser = function(system_uuid, userID, roleID, byWho, cb) {
    if (system_uuid == null || typeof system_uuid != "string") {
        _log.connectionLog(3, 'DBIF::upsertUser(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (userID == null || typeof userID != "string") {
        _log.connectionLog(3, 'DBIF::upsertUser(), Invalid argument of userID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (roleID == null || typeof roleID != "string") {
        _log.connectionLog(3, 'DBIF::upsertUser(), Invalid argument of roleID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (byWho == null || typeof byWho != "string") {
        _log.connectionLog(3, 'DBIF::upsertUser(), Invalid argument of byWho');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBIF::upsertUser(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::upsertUser');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};
    var _role = null;

    var _promises = [];
    _promises.push(_dbCon.models.user.findOne( { where: { user: userID } } ));
    _promises.push(_dbCon.models.role.findOne( { where: { id: roleID } } ));

    Promise.all(_promises)
    .then(function(results) {
        var user = results[0];
        _role = results[1];

        if (_role == null) {
            _log.connectionLog(3, 'DBIF::upsertUser(), role.findeOne return zero: ' + roleID);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::upsertUser there is no such role: ' + roleID};
        }
        if (user == null) {
            return _dbCon.models.user.create({
                user: userID,
                role_id: roleID,
                created_by: byWho
            });
        } else {
            return user.update({
                role_id: roleID,
                updated_by: byWho
            });
        }
    })
    .then(function() {
        return _dbCon.models.user.findOne( { where: { user: userID } } );
    })
    .then(function(user) {
        _log.connectionLog(7, 'DBIF::upsertUser() success: ' + userID + ', ' + roleID);
        _res[userID] = _.pick(
            user,
            'user',
            'role_id',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );
        return _role.getTranslations();
    })
    .then(function(results){
        _res[userID]['role'] = _.pick(
            _role,
            'id',
            'role_tid',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );
        _res[userID].role['t'] = {};
        for (var i = 0; i < results.length; ++i) {
            _res[userID].role.t[results[i].locale] = results[i].t;
        }
        process.nextTick(function() {
            cb(null, _res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            process.nextTick(function() {
                cb(errors);
            });
        } else {
            _log.connectionLog(3, 'DBIF::upsertUser(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::upsertUser failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};


DBIF.prototype.getRightsOfUser = function(system_uuid, userID, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::getRightsOfUser(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(userID)) {
        _log.connectionLog(3, 'DBIF::getRightsOfUser(), Invalid argument of userID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::getRightsOfUser(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::getRightsOfUser');

    var _res = [];

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _user = null;
    var _role = null;

    _dbCon.models.user.findOne({ where: { user: userID }})
    .then(function(user) {
        if (user == null) {
            _log.connectionLog(6, 'DBIF::getRightsOfUser(), user.findeOne return zero: ' + userID);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::getRightsOfUser there is no such user: ' + userID};
        }
        _user = user;
        return _dbCon.models.role.findOne({ where: { id: _user.role_id }});
    })
    .then(function(role) {
        if (role == null) {
            _log.connectionLog(3, 'DBIF::getRightsOfUser(), role.findeOne return zero: ' + _user.role_id);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::getRightsOfUser there is no such role: ' + _user.role_id};
        }
        _role = role;

        var _promises_to_policies = [
            _role.getPolicies(),    
            _user.getPolicies()     
        ];

        return Promise.all(_promises_to_policies);
    })
    .then(function(results) {
        var _promises_to_rights = [];
        var policy_cnt_of_role = results[0].length;
        var policy_cnt_of_user = results[1].length;
        for (var idx = 0; idx < 2; ++idx) {
            for (var jdx = 0; jdx < (idx == 0? policy_cnt_of_role: policy_cnt_of_user); ++jdx) {
                _promises_to_rights.push(
                    results[idx][jdx].getRights()   
                );
            }
        }
        _log.connectionLog(7, 'DBIF::getRightsOfUser() fetching rights: ' + _promises_to_rights.length);

        return Promise.all(_promises_to_rights);
    })
    .then(function(policy_rights) {
        var policy_rights_cnt = policy_rights.length;
        for (var idx = 0; idx < policy_rights_cnt; ++idx) {
            var rights = policy_rights[idx];
            for (var jdx = 0; jdx < rights.length; ++jdx) {
                _res.push(_.pick(
                    rights[jdx],
                    'id',
                    'action',
                    'resource',
                    'condition',
                    'enable_flag',
                    'created_at',
                    'created_by',
                    'updated_at',
                    'updated_by'
                ));
            }
        }
        _log.connectionLog(6, 'DBIF::getRightsOfUser() rights fetched. cnt: ' + _res.length);
        process.nextTick(function() {
            cb(null, _res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            process.nextTick(function() {
                cb(errors);
            });
        } else {
            _log.connectionLog(3, 'DBIF::getRightsOfUser(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::getRightsOfUser failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};


DBIF.prototype.upsertPolicy = function(system_uuid, policyID, policyTID, translations, byWho, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::upsertPolicy(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(policyID)) {
        _log.connectionLog(3, 'DBIF::upsertPolicy(), Invalid argument of policyID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(policyTID)) {
        _log.connectionLog(3, 'DBIF::upsertPolicy(), Invalid argument of policyTID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isObject(translations)) {
        _log.connectionLog(3, 'DBIF::upsertPolicy(), Invalid argument of translations');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(byWho)) {
        _log.connectionLog(3, 'DBIF::upsertPolicy(), Invalid argument of byWho');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::upsertPolicy(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::upsertPolicy');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};

    var _promises = [];

    for (var key in translations) {
        if (! _.isString(translations[key])) {
            _log.connectionLog(4, "DBIF::upsertPolicy(), translations has many keys, so skip this");
            continue;
        }
        _promises.push(
            _dbCon.models.translation.upsert(
                {
                    id: policyTID,
                    locale: key,
                    t: translations[key],
                    created_by: byWho,
                    updated_by: byWho
                }
            )
        );
    }

    _promises.push(
        _dbCon.models.policy.upsert(
            {
                id: policyID,
                policy_tid: policyTID,
                created_by: byWho,
                updated_by: byWho
            }
        )
    );

    Promise.all(_promises)
    .then(function(results) {
        _log.connectionLog(6, 'DBIF::upsertPolicy() success: ' + policyID);
        _log.connectionLog(7, 'DBIF::upsertPolicy() results: ' + JSON.stringify(results));
        return _dbCon.models.policy.findOne({ where: { id: policyID } });
    })
    .then(function(policy) {
        _log.connectionLog(7, 'DBIF::upsertPolicy() fetch inserted policy success: ' + policyID);
        _res = _.pick(
            policy,
            'id',
            'policy_tid',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );
        process.nextTick(function() {
            cb(null, _res); 
        });
    })
    .catch(function(errors) {
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::upsertPolicy failed query to dbName: ' + _dbName + ', err: ' + errors});
        });
    });

};


DBIF.prototype.upsertRight = function(system_uuid, policyID, action, resource, condition, enableFlag, byWho, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(policyID)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of policyID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(action)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of action');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (resource != null && ! _.isString(resource)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of resource');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (condition != null && ! _.isString(condition)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of condition');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isBoolean(enableFlag)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of enableFlag');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(byWho)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of byWho');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::upsertRight(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::upsertRight');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};
    var _policy = null;

    _dbCon.models.policy.findOne( { where: { id: policyID} })
    .then(function(policy) {
        if (policy == null) {
            _log.connectionLog(3, 'DBIF::upsertRight(), policy.findeOne return zero: ' + policyID);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::upsertRight there is no such policy: ' + policyID};
        }
        _policy = policy;

        return _dbCon.models.right.upsert(
            {
                action: action,
                resource: resource,
                condition: condition,
                enable_flag: enableFlag,
                created_by: byWho,
                updated_by: byWho
            }
        );
    })
    .then(function(result) {
        _log.connectionLog(6, 'DBIF::upsertRight() upsert right success: (' + action + ', ' + resource + ', ' + condition + ', ' + enableFlag + ')');
        _log.connectionLog(7, 'DBIF::upsertRight() upsert right result: ' + result);

        return _dbCon.models.right.findOne({
            where: {
                action: action,
                resource: resource,
                condition: condition,
                enable_flag: enableFlag
            }
        });
    })
    .then(function(right) {
        _log.connectionLog(7, 'DBIF::upsertRight() fetch inserted right success: (' + action + ', ' + resource + ', ' + condition + ', ' + enableFlag + ')');

        return _policy.addRight(right);
    })
    .then(function(result) {
        _log.connectionLog(6, 'DBIF::upsertRight() associate policy with right success. TO: ' + policyID);
        _log.connectionLog(7, 'DBIF::upsertRight() associate policy with right result:' + result);

        return _policy.getRights();
    })
    .then(function(rights) {
        _log.connectionLog(7, 'DBIF::upsertRight() fetch all rights owned associated to policy');

        _res = _.pick(
            _policy,
            'id',
            'policy_tid',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );
        for (var idx = 0; idx < rights.length; ++idx) {
            _res["rights"] = _res["rights"] || [];
            _res["rights"].push(
                _.pick(
                    rights[idx],
                    'id',
                    'action',
                    'resource',
                    'condition',
                    'enable_flag',
                    'created_at',
                    'created_by',
                    'updated_by',
                    'updated_at'
                )
            );
        }

        process.nextTick(function() {
            cb(null, _res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            process.nextTick(function() {
                cb(errors);
            });
        } else {
            _log.connectionLog(3, 'DBIF::upsertRight(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::upsertRight failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });
};


DBIF.prototype.assignPolicyToUsers = function(system_uuid, userIDs, policyID, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isArray(userIDs) || _.isEmpty(userIDs)) {
        _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), Invalid argument of userIDs');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(policyID)) {
        _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), Invalid argument of policyID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::assignPolicyToUsers');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _promises = [];

    var _user_ids = [];
    var _user_cnt = userIDs.length;
    _promises.push(
        _dbCon.models.policy.findOne({ where: { id: policyID }})
    );
    userIDs.forEach(function(userID) {
        _user_ids.push(userID);
        _promises.push(
            _dbCon.models.user.findOne({ where: { user: userID }})
        );
    });

    var _failed_user_ids = [];
    var _policy = null;

    Promise.all(_promises)
    .then(function(results) {
        _policy = results[0];
        if (_policy == null) {
            _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), policy.findeOne return zero: ' + policyID);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::assignPolicyToUsers there is no such policy: ' + policyID};
        }
        var _promises_to_set_policy = [];
        var _tmp_user_ids = _user_ids;
        _user_ids = [];
        for (var j = 0; j < _user_cnt; ++j) {
            var _should_be = _tmp_user_ids.shift();
            if (results[1 + j] == null || results[1 + j].user != _should_be) {
                _failed_user_ids.push(_should_be);
                continue;
            }
            _promises_to_set_policy.push(results[1 + j].addPolicy(_policy));
            _user_ids.push(_should_be);
        }
        if (_promises_to_set_policy.length == 0 && _failed_user_ids.length > 0) {
            _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), there is not found user.');
            throw {
                code: DBError.DB_ERR_RESULT_NONE,
                message: 'ERROR: DBIF::assignPolicyToUsers there is not found user.',
                extra: _failed_user_ids
            };
        }
        _log.connectionLog(7, 'DBIF::assignPolicyToUsers() fetch user and policy success.');

        _user_cnt = _user_ids.length;
        return Promise.all(_promises_to_set_policy);
    })
    .then(function(results) {
        for (var k = 0; k < _user_cnt; ++k) {
            var _should_be = _user_ids.shift();
            if (results[k] == null) {
                _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), attach failed to ' + _should_be);
                _failed_user_ids.push(_should_be);
            }
        }
        _log.connectionLog(7, 'DBIF::assignPolicyToUsers() associate users and policy done. ' + policyID);
        return _policy.getTranslations();
    })
    .then(function(results) {
        _policy.t = {};
        for (var l = 0; l < results.length; ++l) {
            _policy.t[results[l].locale] = results[l].t;
        }
        var res = _.pick(
            _policy,
            'id',
            'policy_tid',
            't',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );
        if (_failed_user_ids.length > 0) {
            throw {
                code: DBError.DB_ERR_FAILED_QUERY,
                message: 'ERROR: DBIF::assignPolicyToUsers there is error to attach.',
                extra: _failed_user_ids,
                policy: res
            };
        }
        _log.connectionLog(6, 'DBIF::assignPolicyToUsers() associate users and policy success. ' + policyID);

        process.nextTick(function() {
            cb(null, res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            process.nextTick(function() {
                cb(errors);
            });
        } else {
            _log.connectionLog(3, 'DBIF::assignPolicyToUsers(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::assignPolicyToUsers failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};

DBIF.prototype.unassignPolicyToUsers = function(system_uuid, userIDs, policyID, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isArray(userIDs) || _.isEmpty(userIDs)) {
        _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), Invalid argument of userIDs');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(policyID)) {
        _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), Invalid argument of policyID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::unassignPolicyToUsers');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _promises = [];

    _promises.push(
        _dbCon.models.policy.findOne({ where: { id: policyID }})
    );

    var _user_ids = [];
    var _user_cnt = userIDs.length;
    userIDs.forEach(function(userID) {
        _user_ids.push(userID);
        _promises.push(
            _dbCon.models.user.findOne({ where: { user: userID }})
        );
    });

    var _failed_user_ids = [];
    var _policy = null;

    Promise.all(_promises)
    .then(function(results) {
        _policy = results[0];
        if (_policy == null) {
            _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), policy.findeOne return zero: ' + policyID);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::unassignPolicyToUsers there is no such policy: ' + policyID};
        }

        var _promises_to_unset_policy = [];
        var _tmp_user_ids = _user_ids;
        _user_ids = [];
        for (var j = 0; j < _user_cnt; ++j) {
            var _should_be = _tmp_user_ids.shift();
            if (results[1 + j] == null || results[1 + j].user != _should_be) {
                _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), not found: ' + _should_be);
                _failed_user_ids.push(_should_be);
                continue;
            }
            _promises_to_unset_policy.push(results[1 + j].removePolicy(_policy));
            _user_ids.push(_should_be);
        }
        if (_promises_to_unset_policy.length == 0 && _failed_user_ids.length > 0) {
            _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), there is not found user.');
            throw {
                code: DBError.DB_ERR_RESULT_NONE,
                message: 'ERROR: DBIF::unassignPolicyToUsers there is not found user.',
                extra: _failed_user_ids
            };
        }
        _log.connectionLog(7, 'DBIF::unassignPolicyToUsers() fetch users and policy done.');

        _user_cnt = _user_ids.length;
        return Promise.all(_promises_to_unset_policy);
    })
    .then(function(results) {
        for (var k = 0; k < _user_cnt; ++k) {
            var _should_be = _user_ids.shift();
            if (results[k] != true) {
                _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), dettach failed to ' + _should_be);
                _failed_user_ids.push(_should_be);
            }
        }
        _log.connectionLog(7, 'DBIF::unassignPolicyToUsers() deassociate users and policy done. ' + policyID);

        return _policy.getTranslations();
    })
    .then(function(results) {
        _policy.t = {};
        for (var l = 0; l < results.length; ++l) {
            _policy.t[results[l].locale] = results[l].t;
        }
        var res = _.pick(
            _policy,
            'id',
            'policy_tid',
            't',
            'created_at',
            'created_by',
            'updated_by',
            'updated_at'
        );
        if (_failed_user_ids.length > 0) {
            throw {
                code: DBError.DB_ERR_FAILED_QUERY,
                message: 'ERROR: DBIF::unassignPolicyToUsers there is error to dettach.',
                extra: _failed_user_ids
            };
        }
        _log.connectionLog(6, 'DBIF::unassignPolicyToUsers() deassociate users and policy success. ' + policyID);

        process.nextTick(function() {
            cb(null, res); 
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors) {
            process.nextTick(function() {
                cb(errors);
            });
        } else {
            _log.connectionLog(3, 'DBIF::unassignPolicyToUsers(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::unassignPolicyToUsers failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};

DBIF.prototype.getUsersAttachedWithResource = function(system_uuid, resourceID, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::getUsersAttachedWithResource(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(resourceID)) {
        _log.connectionLog(3, 'DBIF::getUsersAttachedWithResource(), Invalid argument of resourceID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::getUsersAttachedWithResource(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::getUsersAttachedWithResource');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = [];

    _dbCon.query(' \
        SELECT                                              \
              users.id            as user_id                \
            , users.user          as user_user              \
            , users.created_at    as user_created_at        \
            , users.created_by    as user_created_by        \
            , users.updated_at    as user_updated_at        \
            , users.updated_by    as user_updated_by        \
            , policies.id         as policy_id              \
            , policies.policy_tid as policy_tid             \
            , policies.created_at as policy_created_at      \
            , policies.created_by as policy_created_by      \
            , policies.updated_at as policy_updated_at      \
            , policies.updated_by as policy_updated_by      \
            , rights.id           as right_id               \
            , rights.action       as right_action           \
            , rights.resource     as right_resouce          \
            , rights.condition    as right_condition        \
            , rights.enable_flag  as right_enable_flag      \
            , rights.created_at   as right_created_at       \
            , rights.created_by   as right_created_by       \
            , rights.updated_at   as right_updated_at       \
            , rights.updated_by   as right_updated_by       \
        FROM                                                \
              users                                         \
              INNER JOIN user_has_policies                  \
              ON users.id = user_has_policies.user_id       \
              INNER JOIN policies                           \
              ON user_has_policies.policy_id = policies.id  \
              INNER JOIN policy_has_rights                  \
              ON policies.id = policy_has_rights.policy_id  \
              INNER JOIN rights                             \
              ON policy_has_rights.right_id = rights.id     \
        WHERE                                               \
              rights.resource = :resource                   \
        ORDER BY                                            \
              users.id                                      \
            , policies.id                                   \
            , rights.id                                     \
        ',
        {
            replacements: {
                resource: resourceID
            },
            type: QueryTypes.SELECT
        }
    )
    .then(function(results) {
        if (results == null || results.length == 0) {
            _log.connectionLog(4, 'DBIF::getUsersAttachedWithResource(), return zero');
            _res = [];
        } else {
            var _user_cnt = 0;
            var _prev_user_id = null;
            var _policy_cnt = 0;
            var _prev_policy_id = null;
            var _prev_right_id = null;
            results.forEach(function(result) {
                if (result.user_id != _prev_user_id) {
                    _prev_user_id = result.user_id;
                    _prev_policy_id = result.policy_id;
                    _prev_right_id = result.right_id;
                    _res.push({
                        user_id: result.user_id,
                        user: result.user_user,
                        created_at: result.user_created_at,
                        created_by: result.user_created_by,
                        updated_at: result.user_updated_at,
                        updated_by: result.user_updated_by,
                        policies: [
                            {
                                id: result.policy_id,
                                policy_tid: result.policy_tid,
                                created_at: result.policy_created_at,
                                created_by: result.policy_created_by,
                                updated_at: result.policy_updated_at,
                                updated_by: result.policy_updated_by,
                                rights: [
                                    {
                                        id: result.right_id,
                                        action: result.right_action,
                                        resource: result.right_resource,
                                        condition: result.right_condition,
                                        enable_flag: result.right_enable_flag,
                                        created_at: result.right_created_at,
                                        created_by: result.right_created_by,
                                        updated_at: result.right_updated_at,
                                        updated_by: result.right_updated_by
                                    }
                                ]
                            }
                        ]
                    });
                    _user_cnt += 1;

                } else if (result.policy_id != _prev_policy_id) {
                    _prev_policy_id = result.policy_id;
                    _prev_right_id = result.right_id;
                    _res[_user_cnt - 1].policies.push({
                        id: result.policy_id,
                        policy_tid: result.policy_tid,
                        created_at: result.policy_created_at,
                        created_by: result.policy_created_by,
                        updated_at: result.policy_updated_at,
                        updated_by: result.policy_updated_by,
                        rights: [
                            {
                                id: result.right_id,
                                action: result.right_action,
                                resource: result.right_resource,
                                condition: result.right_condition,
                                enable_flag: result.right_enable_flag,
                                created_at: result.right_created_at,
                                created_by: result.right_created_by,
                                updated_at: result.right_updated_at,
                                updated_by: result.right_updated_by
                            }
                        ]
                    });
                    _policy_cnt += 1;

                } else if (_prev_right_id != result.right_id) {
                    _prev_right_id = result.right_id;
                    _res[_user_cnt - 1].policies[_policy_cnt - 1].rights.push({
                        id: result.right_id,
                        action: result.right_action,
                        resource: result.right_resource,
                        condition: result.right_condition,
                        enable_flag: result.right_enable_flag,
                        created_at: result.right_created_at,
                        created_by: result.right_created_by,
                        updated_at: result.right_updated_at,
                        updated_by: result.right_updated_by
                    });

                }
            });
        }
        process.nextTick(function() {
            cb(null, _res);
        });
    })
    .catch(function(errors) {
        _log.connectionLog(3, 'DBIF::getUsersAttachedWithResource(), DB access result failed: ' + errors);
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::getUsersAttachedWithResource failed query to dbName: ' + _dbName + ', err: ' + errors});
        });
    });

};

DBIF.prototype.doesUserHasSpecificRight = function(system_uuid, userID, action, resourceID, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::doesUserHasSpecificRight(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(userID)) {
        _log.connectionLog(3, 'DBIF::doesUserHasSpecificRight(), Invalid argument of userID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(action)) {
        _log.connectionLog(3, 'DBIF::doesUserHasSpecificRight(), Invalid argument of action');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (resourceID != null && ! _.isString(resourceID)) {
        _log.connectionLog(3, 'DBIF::doesUserHasSpecificRight(), Invalid argument of resourceID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::doesUserHasSpecificRight(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (resourceID == null) {
        resourceID = '';
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::doesUserHasSpecificRight');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _res = {};

    _dbCon.query("\
        SELECT rights.enable_flag                           \
        FROM   rights                                       \
               INNER JOIN policy_has_rights                 \
               ON rights.id = policy_has_rights.right_id    \
               INNER JOIN policies                          \
               ON policy_has_rights.policy_id = policies.id \
               INNER JOIN user_has_policies                 \
               ON policies.id = user_has_policies.policy_id \
               INNER JOIN users                             \
               ON user_has_policies.user_id = users.id      \
        WHERE  users.\"user\" = :userid                         \
           AND rights.action = :action                      \
           AND COALESCE(rights.resource, '') = :resource    \
        UNION                                               \
        SELECT rights.enable_flag                           \
        FROM   rights                                       \
               INNER JOIN policy_has_rights                 \
               ON rights.id = policy_has_rights.right_id    \
               INNER JOIN policies                          \
               ON policy_has_rights.policy_id = policies.id \
               INNER JOIN role_has_policies                 \
               ON policies.id = role_has_policies.policy_id \
               INNER JOIN roles                             \
               ON role_has_policies.role_id = roles.id      \
               INNER JOIN users                             \
               ON roles.id = users.role_id                  \
        WHERE  users.\"user\" = :userid                     \
           AND rights.action = :action                      \
           AND COALESCE(rights.resource, '') = :resource    \
        ",
        {
            replacements: {
                userid: userID,
                action: action,
                resource: resourceID
            },
            type: QueryTypes.SELECT
        }
    )
    .then(function(results) {
        if (results == null || results.length == 0) {
            _log.connectionLog(7, 'DBIF::doesUserHasSpecificRight(), return zero');
            _res = {};
        } else {
            _res = { enable_flag: results[0].enable_flag };
        }
        process.nextTick(function() {
            cb(null, _res);
        });
    })
    .catch(function(errors) {
        _log.connectionLog(3, 'DBIF::doesUserHasSpecificRight(), DB access result failed: ' + errors);
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::doesUserHasSpecificRight failed query to dbName: ' + _dbName + ', err: ' + errors});
        });
    });

};


DBIF.prototype.deleteRightPolicyOfResource = function(system_uuid, resourceID, cb) {
    if (! _.isString(system_uuid)) {
        _log.connectionLog(3, 'DBIF::deleteRightPolicyOfResource(), Invalid argument of system_uuid');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isString(resourceID) || resourceID == '') {
        _log.connectionLog(3, 'DBIF::deleteRightPolicyOfResource(), Invalid argument of resourceID');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (! _.isFunction(cb)) {
        _log.connectionLog(3, 'DBIF::deleteRightPolicyOfResource(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    var _dbName = _self.getDbName(system_uuid);
    _log.connectionLog(7, 'DBIF::doesUserHasSpecificRight');

    var _dbCon = _self.dbConnector.getConnection(_dbName);

    var _rights = [];

    var _isDeleted = true;

    _dbCon.models.right.findAll({ where: { resource: resourceID } })
    .then(function(rights) {
        if (rights == null || rights.length == 0) {
            _log.connectionLog(6, 'DBIF::deleteRightPolicyOfResource(), rights.findAll return zero: ' + resourceID);
            throw { code: DBError.DB_ERR_RESULT_NONE, message: 'ERROR: DBIF::deleteRightPolicyOfResource there is no such rights. resourceID: ' + resourceID};
        }
        var _promises = [];
        _rights = rights;
        _rights.forEach(function(right) {
            _promises.push(
                right.getPolicies()
            );
        });
        return Promise.all(_promises);
    })
    .then(function(policiesArray) {
        var _promises = [];
        policiesArray.forEach(function(policies) {
            policies.forEach(function(policy) {
                _promises.push(
                    policy.setRights(null)          
                );
                _promises.push(
                    policy.setUsers(null)           
                );
                _promises.push(
                    policy.destroy({force: true})   
                );
            });
        });
        if (_promises.length == 0) {
            _log.connectionLog(6, 'DBIF::deleteRightPolicyOfResource(), no policy: ' + resourceID);
            return Promise.resolve([]);
        }
        return Promise.all(_promises);
    })
    .then(function(results) {
        results.forEach(function(result) {
            _isDeleted = result? _isDeleted: false;
        });
        var _promises = [];
        _rights.forEach(function(right) {
            _promises.push(
                right.destroy({force: true})        
            );
        });
        return Promise.all(_promises);
    })
    .then(function(results) {
        results.forEach(function(result) {
            _isDeleted = result? _isDeleted: false;
        });
        _log.connectionLog(7, 'DBIF::deleteRightPolicyOfResource(), success.: ' + _isDeleted);
        process.nextTick(function() {
            cb(null, {deleted: _isDeleted});
        });
    })
    .catch(function(errors) {
        if (typeof errors == 'object' && 'code' in errors && errors.code == DBError.DB_ERR_RESULT_NONE) {
            process.nextTick(function() {
                cb(null, {deleted: false});
            });
        } else {
            _log.connectionLog(3, 'DBIF::deleteRightPolicyOfResource(), DB access result failed: ' + errors);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_FAILED_QUERY, message: 'ERROR: DBIF::deleteRightPolicyOfResource failed query to dbName: ' + _dbName + ', err: ' + errors});
            });
        }
    });

};

exports.create = create;
