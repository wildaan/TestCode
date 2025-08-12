"use strict";
/** @typedef {import('@adonisjs/framework/src/Request')} Request */

class ApiMiddleware {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    request.CLIStartTime = Date.now();

    const path = request.url();

    // Split the path into components using the '/' separator
    let components = path.split("/");

    // Remove the first component (empty string)
    components = components.slice(1);

    // If there are any remaining components, remove the last component
    if (components.length > 0) {
      components = components.slice(0, -1);
    }

    request.CLIParsingPath = components;

    await next();
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle({ request }, next) {
    // call next to advance the request
    await next();
  }
}

module.exports = ApiMiddleware;
