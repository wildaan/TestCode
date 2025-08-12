"use strict";

const OutputHelper = use("App/Helpers/OutputHelper");

const ErrorHelper = {
  messageDBErrorExecuting() {
    return "Error occurred while executing query";
  },
  messageDBErrorConnect() {
    return "Error Establishing a Database Connection";
  },

  badRequest(request, response, message = "Bad Request", result = null) {
    ErrorHelper.errorResponse(request, response, 400, message, result);
  },

  unauthorized(request, response, message = "Unauthorized") {
    ErrorHelper.errorResponse(request, response, 401, message);
  },

  forbidden(request, response) {
    ErrorHelper.errorResponse(request, response, 403, "Forbidden");
  },

  notFound(request, response) {
    ErrorHelper.errorResponse(request, response, 404, "Service Not Found");
  },

  serverError(request, response, message = "Internal Server Error") {
    ErrorHelper.errorResponse(request, response, 500, message);
  },

  unavailable(request, response) {
    ErrorHelper.errorResponse(request, response, 503, "Service Unavailable");
  },

  customError(request, response, code, message) {
    ErrorHelper.errorResponse(request, response, code, message);
  },

  errorResponse(req, res, code, message = "", response = []) {
    OutputHelper.output(req, res, {
      code: code,
      status: false,
      message: message,
      response,
    });
  },
};

module.exports = ErrorHelper;
