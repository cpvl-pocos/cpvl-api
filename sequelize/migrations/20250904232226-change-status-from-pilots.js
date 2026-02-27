'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('pilots', 'status', {
      type: Sequelize.ENUM('filiado', 'desfiliado', 'expulso', 'pendente', 'suspenso', 'trancado'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('pilots', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};