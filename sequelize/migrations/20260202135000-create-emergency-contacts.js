'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists before creating
    const tables = await queryInterface.showAllTables();
    if (tables.includes('emergency_contacts')) {
      console.log('emergency_contacts table already exists, skipping...');
      return;
    }
    await queryInterface.createTable('emergency_contacts', {
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
      contactName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contactPhone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bloodType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      healthInsurance: {
        type: Sequelize.STRING,
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('emergency_contacts');
  },
};
