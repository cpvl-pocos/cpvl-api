'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE pilots 
      MODIFY COLUMN status 
      ENUM('filiado', 'desfiliado', 'expulso', 'pendente', 'suspenso', 'trancado') 
      NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE pilots 
      MODIFY COLUMN status 
      ENUM('','ativo', 'inativo', 'pendente', 'trancado') 
      NULL;
    `);
  }
};
