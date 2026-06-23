'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('pilots', 'agreeLGPD', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        after: 'agreeRI',
      });
    } catch (e) {
      console.log('agreeLGPD column already exists, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pilots', 'agreeLGPD');
  }
};
