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
(function() {
    var GlobalSNSManagerDbConnector = require('../DbHelper/global_sns_manager_db_connector');
    var Utils = require('../../utils');

    function XmppServerData() {

        this.REDIS_DATA_TYPE = 'hash';
        this.REDIS_KEY_NAME = 'xmpp_server_store';

        this.setFieldName(null);
        this._tenantUuid = null;
        this._portClnt = null;

    };

    XmppServerData.createAsOrder = function(serverName) {
        if (serverName == null || typeof serverName != 'string' || serverName == '') {
            return null;
        }
        var _xmppServerData = new XmppServerData();
        _xmppServerData.setFieldName(serverName);

        return _xmppServerData;
    }

    var _proto = XmppServerData.prototype;

    _proto.setFieldName = function(fieldName) {
        this._REDIS_FIELD_NAME = fieldName;
    };
    _proto.getFieldName = function() {
        return this._REDIS_FIELD_NAME;
    }

    _proto.createDish = function(serverName, data) {
        if (serverName == null || typeof serverName != 'string' || serverName == '') {
            return null;
        }
        if (data == null || typeof data != 'string' || data == '') {
            return null;
        }

        var _xmppServerData = new XmppServerData();
        _xmppServerData.setFieldName(serverName);

        var _tempJson = JSON.parse( data );
        var _t_tenant_uuid = _tempJson.tenant_uuid;
        var _t_port_clnt = _tempJson.port_clnt;
        if (_t_tenant_uuid == null || typeof _t_tenant_uuid != 'string' || _t_tenant_uuid == '') {
            return null;
        }
        if (_t_port_clnt == null || typeof _t_port_clnt != 'number') {
            return null;
        }

        _xmppServerData.setTenantUuid(_t_tenant_uuid);
        _xmppServerData.setPortClnt(_t_port_clnt);

        return _xmppServerData;
    }

    _proto.createDishByDBSource = function(serverName, datas) {
        if (serverName == null || typeof serverName != 'string' || serverName == '') {
            return null;
        }
        if (datas == null || typeof datas != 'object' || datas.length != 1) {
            return null;
        }

        var _xmppServerData = new XmppServerData();
        _xmppServerData.setFieldName(serverName);

        var _t_tenant_uuid = Utils.getChildObject(datas[0], 'tenant_uuid');
        var _t_port_clnt = Utils.getChildObject(datas[0], 'port_clnt');
        if (_t_tenant_uuid == null || typeof _t_tenant_uuid != 'string' || _t_tenant_uuid == '') {
            return null;
        }
        if (_t_port_clnt == null || typeof _t_port_clnt != 'number') {
            return null;
        }

        _xmppServerData.setTenantUuid(_t_tenant_uuid);
        _xmppServerData.setPortClnt(_t_port_clnt);

        return _xmppServerData;
    }

    _proto.getSql = function() {
        var _self = this;
        var _sql = '';
        _sql += ' SELECT * FROM ' + _self.REDIS_KEY_NAME;
        _sql += ' WHERE server_name = ';
        _sql += GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_self.getFieldName());
        return _sql;
    }

    _proto.getServerName = function() {
        return this.getFieldName();
    };
    _proto.setServerName = function(serverName) {
        this.setFieldName(serverName);
    };

    _proto.getTenantUuid = function() {
        return this._tenantUuid;
    };
    _proto.setTenantUuid = function(tenantUuid) {
        this._tenantUuid = tenantUuid;
    };

    _proto.getPortClnt = function() {
        return this._portClnt;
    };
    _proto.setPortClnt = function(portClnt) {
        this._portClnt = portClnt;
    };

    _proto.getData = function() {
        var _data = {};
        _data['tenant_uuid'] = this.getTenantUuid();
        _data['port_clnt'] = this.getPortClnt();
        return JSON.stringify(_data);
    }

    exports.createAsOrder = XmppServerData.createAsOrder;
    exports.REDIS_DATA_TYPE = XmppServerData.REDIS_DATA_TYPE;
    exports.REDIS_KEY_NAME = XmppServerData.REDIS_KEY_NAME;
})();
