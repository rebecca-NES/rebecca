/**
 * Authority DB right model
 * @module  src/scripts/Auhority/db/models/right
 */

module.exports = function(sequelize) {

    var Sequelize = require('sequelize');

    return sequelize.define('right', {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true
        },
        action: {
            type: Sequelize.STRING(512),
            allowNull: false
        },
        resource: {
            type: Sequelize.STRING(512),
            allowNull: true
        },
        condition: {
            type: Sequelize.STRING(512),
            allowNull: true
        },
        enable_flag: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
        indexes: [
            {
                unique: true,
                fields: ['right', 'instance', 'condition', 'enable_flag']
            }
        ],
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

};
