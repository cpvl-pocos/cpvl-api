'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('paymentMonthlies', 'status');
    } catch (e) {
      console.log('Status column already removed, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('paymentMonthlies', 'status', {
      type: Sequelize.ENUM('em dia', 'em aberto'),
      defaultValue: 'em aberto',
    });
  }
};
