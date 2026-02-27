'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('paymentMonthlies', 'date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('paymentMonthlies', 'date', {
      type: Sequelize.DATE, // Volta para DATETIME (YYYY-MM-DD HH:mm:ss)
      allowNull: true,
    });
  }
};
