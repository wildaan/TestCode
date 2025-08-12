"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class SysUsers extends Model {
  static get table() {
    return "master.sys_users";
  }
}

module.exports = SysUsers;
