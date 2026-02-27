'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('license_data', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      civl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pilotLevel: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cbvl_expiration: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      imgCbvl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      anacExpiration: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      imgAnac: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('license_data');
  },
};
