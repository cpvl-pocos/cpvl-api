'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('emergency_contacts', 'allergies', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (e) {
      console.log('allergies column already exists, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('emergency_contacts', 'allergies');
  },
};
