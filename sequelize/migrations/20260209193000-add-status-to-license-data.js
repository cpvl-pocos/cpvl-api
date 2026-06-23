'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('license_data', 'status', {
        type: Sequelize.ENUM('Confirmar', 'Confirmado'),
        allowNull: false,
        defaultValue: 'Confirmar',
        after: 'imgAnac'
      });
    } catch (e) {
      console.log('status column already exists on license_data, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('license_data', 'status');
  },
};
