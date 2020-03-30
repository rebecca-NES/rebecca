/**
 * Authority DB role model
 * @module  src/scripts/Auhority/db/models/role
 */

module.exports = function(sequelize) {

    var Sequelize = require('sequelize');

    /**
     * role モデル定義
     * @type {object}
     */
    return sequelize.define('role', {
        id: {
            type: Sequelize.STRING(100),
            primaryKey: true
        },
        role_tid: {
            type: Sequelize.STRING(100),
            primaryKey: true
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
