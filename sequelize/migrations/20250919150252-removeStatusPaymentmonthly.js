'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('paymentMonthlies', 'status');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('paymentMonthlies', 'status', {
      type: Sequelize.ENUM('em dia', 'em aberto'),
      defaultValue: 'em aberto',
    });
  }
};
