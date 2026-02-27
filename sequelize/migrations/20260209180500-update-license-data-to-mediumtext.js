'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('license_data', 'imgCbvl', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
    await queryInterface.changeColumn('license_data', 'imgAnac', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('license_data', 'imgCbvl', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.changeColumn('license_data', 'imgAnac', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
