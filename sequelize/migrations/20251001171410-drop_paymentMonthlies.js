'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Exclui a tabela PaymentMonthlies
    await queryInterface.dropTable('PaymentMonthlies');
  },

  down: async (queryInterface, Sequelize) => {
    // Recria a tabela caso precise reverter
    await queryInterface.createTable('PaymentMonthlies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // ajuste conforme sua tabela de usuários
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ref_year: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Confirmar', 'Confirmado'),
        allowNull: false,
        defaultValue: 'Confirmado',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
};
