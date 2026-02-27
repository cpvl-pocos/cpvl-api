'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename column
    await queryInterface.renameColumn('license_data', 'cbvl_expiration', 'cbvlExpiration');

    // Change pilotLevel to ENUM
    // Note: In some databases (like MySQL), changing type to ENUM might require specific handling if data exists,
    // but since this is a new table and we are in early development, a straightforward change should work.
    await queryInterface.changeColumn('license_data', 'pilotLevel', {
      type: Sequelize.ENUM('I', 'II', 'III', 'IV', 'V'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert pilotLevel to STRING
    await queryInterface.changeColumn('license_data', 'pilotLevel', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Rename back
    await queryInterface.renameColumn('license_data', 'cbvlExpiration', 'cbvl_expiration');
  },
};
