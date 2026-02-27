'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // MySQL syntax to modify column type
    return queryInterface.sequelize.query(`
      ALTER TABLE paymentMonthlies
      MODIFY COLUMN status ENUM('Confirmar', 'Confirmado')
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // MySQL syntax to revert column type
    return queryInterface.sequelize.query(`
      ALTER TABLE paymentMonthlies
      MODIFY COLUMN status ENUM('Em aviso', 'Confirmado')
    `);
  }
};
