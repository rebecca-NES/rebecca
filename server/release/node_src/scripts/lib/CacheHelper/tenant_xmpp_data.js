(function() {
    var GlobalSNSManagerDbConnector = require('../DbHelper/global_sns_manager_db_connector');
    var Utils = require('../../utils');

    /**
    *  テナントの保持するxmppサーバをリストするクラス
    */
    function TenantXmppData() {

        // redis でのデータ型の名称
        this.REDIS_DATA_TYPE = 'hash';
        // redis でのキー名
        this.REDIS_KEY_NAME = 'tenant_xmpp_list';

        this.setFieldName(null);
        this._xmppServerNames = null;
        this._tenantName = null;

    };

    /**
    * CacheCheff で使用する場合の生成メソッド
    * @param {string} tenantUuid フィールド名であるテナントUUID名
    * @return {object} TenantXmppData 生成したTenantDataを返却
    */
    TenantXmppData.createAsOrder = function(tenantUuid) {
        if (tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            return null;
        }
        var _tenantXmppData = new TenantXmppData();

        _tenantXmppData.setFieldName(tenantUuid);

        return _tenantXmppData;
    }

    var _proto = TenantXmppData.prototype;

    /// redisフィールド名
    _proto.setFieldName = function(fieldName) {
        this._REDIS_FIELD_NAME = fieldName;
    };
    _proto.getFieldName = function() {
        return this._REDIS_FIELD_NAME;
    }

    // 保持データ
    _proto.getData = function() {
        /* EXAMPLE
        data = '{ "xmpp_server_names": ["spf-dckr-of-aa944196-e5d5-11e5-84b4-000c29690167-01"], "tenant_name": "spf" }';
        */
        var _data = {};
        _data['xmpp_server_names'] = this.getXmppServerNames();
        _data['tenant_name'] = this.getTenantName();
        return JSON.stringify(_data);
    }

    /**
    * Cach(redis)データからデータモデルインスタンスを生成するメソッド
    * @param {string} tenantUuid フィールド名であるテナントUUID
    * @param {string} data Redisから取得したJSON形式のデータ
    *                 ex) '{
    *                           "xmpp_server_names": ["spf-dckr-of-aa944196-e5d5-11e5-84b4-000c29690167-01"],
    *                           "tenant_name": "spf"
    *                      }'
    * @return {object} TenantXmppData 生成したTenantDataを返却
    */
    _proto.createDish = function(tenantUuid, data) {
        if (tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            return null;
        }
        if (data == null || typeof data != 'string' || data == '') {
            return null;
        }

        var _tenantXmppData = new TenantXmppData();
        _tenantXmppData.setFieldName(tenantUuid);

        var _tempJson = JSON.parse( data );
        var _t_tenant_name = _tempJson.tenant_name;
        var _t_xmpp_server_names = _tempJson.xmpp_server_names;
        if (_t_tenant_name == null || typeof _t_tenant_name != 'string' || _t_tenant_name == '') {
            return null;
        }
        if (_t_xmpp_server_names == null || typeof _t_xmpp_server_names != 'object' || _t_xmpp_server_names.length == 0) {
            return null;
        }

        _tenantXmppData.setXmppServerNames(_t_xmpp_server_names);
        _tenantXmppData.setTenantName(_t_tenant_name);

        return _tenantXmppData;
    }

    /**
    * DBデータからデータモデルインスタンスを生成するメソッド
    * @param {string} tenantUuid フィールド名であるテナントUUID
    * @param {object} datas DBから取得したデータ配列
    * @return {object} TenantXmppData 生成したTenantDataを返却
    */
    _proto.createDishByDBSource = function(tenantUuid, datas) {
        if (tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            return null;
        }
        if (datas == null || typeof datas != 'object' || datas.length == 0) {
            return null;
        }

        var _tenantXmppData = new TenantXmppData();
        _tenantXmppData.setFieldName(tenantUuid);

        var _t_tenant_name = Utils.getChildObject(datas[0], 'name');
        if (_t_tenant_name == null || typeof _t_tenant_name != 'string' || _t_tenant_name == '') {
            return null;
        }
        _tenantXmppData.setTenantName(_t_tenant_name);

        var _tempXmppServerNames = [];
        for (i = 0; i < datas.length; ++i) {
            _t_xmpp_servername = Utils.getChildObject(datas[i], 'server_name');
            if (_t_xmpp_servername == null || typeof _t_xmpp_servername != 'string' || _t_xmpp_servername == '') {
                return null;
            }
            _tempXmppServerNames.push(_t_xmpp_servername);
        }
        _tenantXmppData.setXmppServerNames(_tempXmppServerNames);

        return _tenantXmppData;
    }

    /**
    * Cach(redis) にデータがない場合にDB(globalsns_manager)に発行するSQL
    * @return {string} SQL文
    */
    _proto.getSql = function() {
        var _sql = '';
        _sql += ' SELECT t.name, x.server_name ';
        _sql += ' FROM tenant_store t inner join xmpp_server_store x ';
        _sql += '   on t.uuid = x.tenant_uuid';
        _sql += ' WHERE  t.uuid = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(this.getFieldName());
        return _sql;
    }

    // テナントUUID
    _proto.getTenantUuid = function() {
        return this.getFieldName();
    };
    _proto.setTenantUuid = function(tenantUuid) {
        this.setFieldName(tenantUuid);
    };

    // XMPPサーバ名
    _proto.getXmppServerNames = function() {
        return this._xmppServerNames;
    };
    _proto.setXmppServerNames = function(serverNames) {
        this._xmppServerNames = serverNames;
    };

    // テナント名
    _proto.getTenantName = function() {
        return this._tenantName;
    };
    _proto.setTenantName = function(tenantName) {
        this._tenantName = tenantName;
    };

    exports.createAsOrder = TenantXmppData.createAsOrder;
    exports.REDIS_DATA_TYPE = TenantXmppData.REDIS_DATA_TYPE;
    exports.REDIS_KEY_NAME = TenantXmppData.REDIS_KEY_NAME;
})();
