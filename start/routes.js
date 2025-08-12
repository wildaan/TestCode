"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const path = require("path");
const Route = use("Route");
const ErrorHelper = use("App/Helpers/ErrorHelper");

Route.get("*", async ({ request, response }) => {
  await dispatcher(request, response);
});
Route.post("*", async ({ request, response }) => {
  await dispatcher(request, response);
});

const dispatcher = async (request, response) => {
  if (request.url() === "/favicon.ico") {
    response.status(204).end();
    return;
  }

  let [controllerExist, controllerName] = initiateClass(request);
  if (controllerExist) {
    let [functionExist, functionName] = initiateFunction(
      request,
      controllerName
    );
    if (functionExist) {
      await controllerName[functionName]({ request, response });
      return;
    }
  }
  ErrorHelper.notFound(request, response);
};

const initiateClass = (request) => {
  try {
    // const Controller = use(
    //   path.join(
    //     "App/ConTrollers/Http",
    //     pathToController(request.CLIParsingPath)
    //   )
    // );
    const Controller = use("App/Controllers/Http/"+pathToController(request.CLIParsingPath))
    return [true, new Controller()];
  } catch (error) {
    console.error(error.message);
    return [false, null];
  }
};

const initiateFunction = (request, controller) => {
  const methods = Object.getOwnPropertyNames(
    Object.getPrototypeOf(controller)
  ).filter((key) => typeof controller[key] === "function");

  let methodExist = false;
  let functionName = "";

  for (let method of methods) {
    const fn = request.CLIParsingPath[request.CLIParsingPath.length - 1] ?? "";
    if (method.toUpperCase() === fn.toUpperCase()) {
      methodExist = true;
      functionName = method;
    }
  }
  return [methodExist, functionName];
};

const pathToController = (paths) => {
  const capitalizedArray = paths.map(function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  let result = capitalizedArray.join("/");

  const lastSlashIndex = result.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    result = result.substring(0, lastSlashIndex) + "Controller";
  }

  return result;
};
