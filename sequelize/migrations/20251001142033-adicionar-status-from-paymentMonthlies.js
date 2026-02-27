'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Remover todas as linhas onde amount = 0
    await queryInterface.bulkDelete('paymentMonthlies', {
      amount: 0,
    });

    // 2. Alterar coluna ref_year de number para string (PostgreSQL: INTEGER -> TEXT)
    await queryInterface.changeColumn('paymentMonthlies', 'ref_year', {
      type: Sequelize.STRING,
      allowNull: false, // mantenha allowNull conforme seu model
    });

    // 3. Adicionar coluna status
    await queryInterface.addColumn('paymentMonthlies', 'status', {
      type: Sequelize.ENUM('Confirmar', 'Confirmado'),
      allowNull: false,
      defaultValue: 'Confirmado',
    }, {
      after: 'type', // Posição desejada
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Remover coluna status
    await queryInterface.removeColumn('paymentMonthlies', 'status');

    // 2. Alterar coluna ref_year de volta para number
    await queryInterface.changeColumn('paymentMonthlies', 'ref_year', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // 3. Não é possível restaurar registros deletados automaticamente
  },
};