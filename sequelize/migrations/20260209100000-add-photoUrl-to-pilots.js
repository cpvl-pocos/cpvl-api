'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('pilots', 'photo_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (e) {
      console.log('photo_url column already exists, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pilots', 'photo_url');
  },
};
