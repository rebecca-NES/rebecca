/**
 * Authority DB models
 * @module  src/scripts/Auhority/db/models/models
 */

/**
 * モデル定義を生成して、DBに保持する
 * @param  {sequelize.dbconnection} con 接続済みDB情報
 * @return {object} 生成したモデル定義
 */
function generateModels(con) {

    var _models = {};

    // 各 js ファイルからモデル定義を読み込み、DBとマッチさせる
    _models.Translation = require('./translation')(con);
    _models.Role = require('./role')(con);
    _models.Right = require('./right')(con);
    _models.Policy = require('./policy')(con);
    _models.User = require('./user')(con);

    // 以下、association 定義

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
