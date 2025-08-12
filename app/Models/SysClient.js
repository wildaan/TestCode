"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class SysClient extends Model {
  static get table() {
    return "master.sys_clients";
  }

  static get primaryKey() {
    return "client_id";
  }

  static get createdAtColumn() {
    return null;
  }

  static get updatedAtColumn() {
    return null;
  }
}

module.exports = SysClient;
