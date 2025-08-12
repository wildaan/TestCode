"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class SysClientToken extends Model {
  static get table() {
    return "master.sys_client_tokens";
  }

  static get primaryKey() {
    return "client_token_id";
  }

  static get createdAtColumn() {
    return null;
  }

  static get updatedAtColumn() {
    return null;
  }
}

module.exports = SysClientToken;
