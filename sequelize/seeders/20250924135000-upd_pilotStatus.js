'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'pilots',
      { status: 'filiado' },
      {
        id: { [Sequelize.Op.ne]: null } // WHERE id IS NOT NULL
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'pilots',
      { status: null },
      {
        id: { [Sequelize.Op.ne]: null }
      }
    );
  }
};