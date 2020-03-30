/**
 * Authority DB translation model
 * @module  src/scripts/Auhority/db/models/translation
 */

module.exports = function(sequelize) {

    var Sequelize = require('sequelize');

    /**
     * translateion モデル定義
     * @type {object}
     */
    return sequelize.define('translation', {
        id: {
            type: Sequelize.STRING(100),
            primaryKey: true
        },
        locale: {
            type: Sequelize.STRING(10),
            primaryKey: true
        },
        t: {
            type: Sequelize.STRING(512),
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
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

};
