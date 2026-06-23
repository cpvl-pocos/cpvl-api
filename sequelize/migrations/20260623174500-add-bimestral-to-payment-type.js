'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('paymentMonthlies', 'type', {
      type: Sequelize.ENUM('mensal', 'bimestral', 'trimestral', 'semestral', 'anual'),
      allowNull: true,
      defaultValue: 'mensal'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('paymentMonthlies', 'type', {
      type: Sequelize.ENUM('mensal', 'trimestral', 'semestral', 'anual'),
      allowNull: true,
      defaultValue: 'mensal'
    });
  }
};
