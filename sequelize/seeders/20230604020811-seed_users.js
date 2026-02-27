'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = bcrypt.genSaltSync(10);
    const password = await bcrypt.hash('password123', salt);

    const users = [
      {
        username: 'admin',
        password: password,
        role: 'admin',
      },
      {
        username: 'fiscal',
        password: password,
        role: 'fiscal',
      },
      {
        username: 'piloto',
        password: password,
        role: 'piloto',
      },
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
