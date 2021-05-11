'use strict';
module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    name: DataTypes.STRING,
    parent_id: DataTypes.INTEGER
  }, {});
  Location.associate = function(models) {
    // associations can be defined here
  };
  return Location;
};