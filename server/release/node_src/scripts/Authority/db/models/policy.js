/**
 * Authority DB policy model
 * @module  src/scripts/Auhority/db/models/policy
 */

module.exports = function(sequelize) {

    var Sequelize = require('sequelize');

    return sequelize.define('policy', {
        id: {
            type: Sequelize.STRING(100),
            primaryKey: true
        },
        policy_tid: {
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
