'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('license_data', 'status', {
      type: Sequelize.ENUM('Confirmar', 'Confirmado'),
      allowNull: false,
      defaultValue: 'Confirmar',
      // To place it before createdAt, we can use 'after' in MySQL
      // We'll place it after 'imgAnac'
      after: 'imgAnac'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('license_data', 'status');
    // Note: In some versions of Sequelize/MySQL, you might need to drop the Enum type separately if it's PostgreSQL,
    // but for MySQL, it's usually handled within the column.
  },
};
