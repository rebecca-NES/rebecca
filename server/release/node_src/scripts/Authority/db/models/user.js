/**
 * Authority DB user model
 * @module  src/scripts/Auhority/db/models/user
 */

module.exports = function(sequelize) {

    var Sequelize = require('sequelize');

    /**
     * user モデル定義
     * @type {object}
     */
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
