'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pilots', 'agreeLGPD', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'agreeRI',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pilots', 'agreeLGPD');
  }
};
