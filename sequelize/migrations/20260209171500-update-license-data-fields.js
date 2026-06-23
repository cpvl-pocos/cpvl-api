'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Rename column
      await queryInterface.renameColumn('license_data', 'cbvl_expiration', 'cbvlExpiration');
    } catch (e) {
      console.log('cbvl_expiration already renamed, skipping...');
    }

    try {
      // Change pilotLevel to ENUM
      await queryInterface.changeColumn('license_data', 'pilotLevel', {
        type: Sequelize.ENUM('I', 'II', 'III', 'IV', 'V'),
        allowNull: true,
      });
    } catch (e) {
      console.log('pilotLevel already updated, skipping...');
    }
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
