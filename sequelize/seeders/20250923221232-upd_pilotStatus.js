'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'pilots',
      { status: 'filiado' }, // valores a serem atualizados
      {}                   // condição: vazio = todos os registros
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'pilots',
      { status: null },
      {}
    );
  }
};
