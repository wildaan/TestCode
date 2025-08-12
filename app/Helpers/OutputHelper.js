"use strict";

const OutputHelper = {
  output(req, res, { code = 200, status = true, message = "", response = [] }) {
    res.status(code).send({
      status: status,
      message,
      response,
      generated: (Date.now() - req.CLIStartTime) / 1000,
      tokenExpire: req.CLITokenExpired ?? null,
      serverTime: Math.floor(Date.now() / 1000),
    });
  },
};

module.exports = OutputHelper;
