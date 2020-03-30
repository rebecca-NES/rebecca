(function() {
    var GlobalSNSManagerDbConnector = require('../DbHelper/global_sns_manager_db_connector');
    var Utils = require('../../utils');

    /**
    * xmpp_server_store モデルクラス
    */
    function XmppServerData() {

        // redis でのデータ型の名称
        this.REDIS_DATA_TYPE = 'hash';
        // redis でのキー名
        this.REDIS_KEY_NAME = 'xmpp_server_store';

        this.setFieldName(null);
        this._tenantUuid = null;
        this._portClnt = null;

    };

    /**
    * CacheCheff で使用する場合の生成メソッド
    * @param {string} serverName string フィールド名であるXMPPサーバ名
    * @return {object} XmppServerData 生成したTenantDataを返却
    */
    XmppServerData.createAsOrder = function(serverName) {
        if (serverName == null || typeof serverName != 'string' || serverName == '') {
            return null;
        }
        var _xmppServerData = new XmppServerData();
        _xmppServerData.setFieldName(serverName);

        return _xmppServerData;
    }

    var _proto = XmppServerData.prototype;

    /// redisフィールド名
    _proto.setFieldName = function(fieldName) {
        this._REDIS_FIELD_NAME = fieldName;
    };
    _proto.getFieldName = function() {
        return this._REDIS_FIELD_NAME;
    }

    /**
    * Cach(redis)データからデータモデルインスタンスを生成するメソッド
    * @param {string} serverName フィールド名であるXMPPサーバ名
    * @param {string} data Redisから取得したJSON形式のデータ
    *                 ex) '{ "tenant_uuid": "aa944196-e5d5-11e5-84b4-000c29690167", "port_clnt": "5222" }'
    * @return {object} XmppServerData 生成したXmppServerDataを返却
    */
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

    /**
    * DBデータからデータモデルインスタンスを生成するメソッド
    * @param {string} serverName フィールド名であるXMPPサーバ名
    * @param {object} datas DBから取得したデータ配列
    * @return {object} XmppServerData 生成したXmppServerDataを返却
    */
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

    /**
    * Cach(redis) にデータがない場合にDB(globalsns_manager)に発行するSQL
    * @return {string} SQL文
    */
    _proto.getSql = function() {
        var _self = this;
        var _sql = '';
        _sql += ' SELECT * FROM ' + _self.REDIS_KEY_NAME;
        _sql += ' WHERE server_name = ';
        _sql += GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_self.getFieldName());
        return _sql;
    }

    // サーバ名
    _proto.getServerName = function() {
        return this.getFieldName();
    };
    _proto.setServerName = function(serverName) {
        this.setFieldName(serverName);
    };

    // テナントUUID
    _proto.getTenantUuid = function() {
        return this._tenantUuid;
    };
    _proto.setTenantUuid = function(tenantUuid) {
        this._tenantUuid = tenantUuid;
    };

    // クライアントポート
    _proto.getPortClnt = function() {
        return this._portClnt;
    };
    _proto.setPortClnt = function(portClnt) {
        this._portClnt = portClnt;
    };

    // 保持データ
    _proto.getData = function() {
        /* EXAMPLE
        data = '{ "tenant_uuid": "aa944196-e5d5-11e5-84b4-000c29690167", "port_clnt": "5222" }'
        */
        var _data = {};
        _data['tenant_uuid'] = this.getTenantUuid();
        _data['port_clnt'] = this.getPortClnt();
        return JSON.stringify(_data);
    }

    exports.createAsOrder = XmppServerData.createAsOrder;
    exports.REDIS_DATA_TYPE = XmppServerData.REDIS_DATA_TYPE;
    exports.REDIS_KEY_NAME = XmppServerData.REDIS_KEY_NAME;
})();
