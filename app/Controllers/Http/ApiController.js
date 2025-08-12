"use strict";

const crypto = require("crypto");
const Env = use("Env");
const { validate } = use("Validator");
const SysClient = use("App/Models/SysClient");
const SysClientToken = use("App/Models/SysClientToken");
const ErrorHelper = use("App/Helpers/ErrorHelper");
const OutputHelper = use("App/Helpers/OutputHelper");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");

class ApiController {
  noTokenNeeded = ["auth/connect", "auth/getAccessToken","stock/list"];
  userdata = {};

  async startProcess({ request, response }, method = "GET") {
    this.ctx = { request, response };
    request.CLITokenExpired = null;

    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "*");

    if (method.toUpperCase() === "GET") {
      this.param = request.get();
    } else if (method.toUpperCase() === "POST") {
      this.param = request.post();
    } else {
      this.param = request.all();
    }

    this.email = request.header("email") ?? null;
    this.accessId = request.header("accessId") ?? null;
    this.appCode = request.header("appCode") ?? null;
    this.accessToken = request.header("accessToken") ?? null;
    this.accessUuid = request.header("accessUuid") ?? null;
    //this.tokenId = request.header("tokenId") ?? null;

    if (request.method().toUpperCase() != method.toUpperCase()) {
      this.breakProcess("Method tidak diizinkan");
      return false;
    }

    if (this.appCode === null) {
      this.breakProcess("AppCode harus dikirim");
      return false;
    }

    if (!this.noTokenNeeded.includes(request.CLIParsingPath.join("/"))) {
      if (this.accessToken === null) {
        this.breakProcess("AccessToken harus dikirim");
        return false;
      } else {
        // if (this.tokenId !== null) {
        //   let [decryptData, decryptError] = await this.decrypt(this.tokenId);
        //   if (decryptError !== null) {
        //     this.breakProcess("TokenId tidak sesuai");
        //     return false;
        //   }
        //   this.userdata = decryptData;
        // }

        const thisTime = moment().format("YYYY-MM-DD HH:mm:ss");
        const client = await SysClient.query()
          .select("client_uuid")
          .innerJoin(
            "master.sys_client_tokens",
            "client_token_client_uuid",
            "client_uuid"
          )
          .where("client_appcode", this.appCode)
          .where("client_token_access", this.accessToken)
          .where("client_service", Env.get("SERVICE_INITIAL"))
          .where("client_date_start", "<=", thisTime)
          .where(function (query) {
            query
              .whereRaw("client_date_end IS NULL")
              .orWhereRaw("client_date_end >= ?", [thisTime]);
          })
          .where("client_token_expire", ">=", thisTime)
          .where("client_status", 1)
          .first();

        if (client === null) {
          this.breakProcess("AccessToken tidak sesuai");
          return false;
        }

        const timeAdd =
          Math.floor(Date.now() / 1000) +
          3600 *
            (Buffer.from(this.accessToken, "base64")
              .toString("utf-8")
              .slice(-1) === "1"
              ? 8600
              : 1);

        const timeText = moment.unix(timeAdd).format("YYYY-MM-DD HH:mm:ss");
        request.CLITokenExpired = timeAdd;

        await SysClientToken.query()
          .where("client_token_access", this.accessToken)
          .update({ client_token_expire: timeText });

        //activity
      }
    }

    return true;
  }

  async validation(rules) {
    let status = true;
    //let message = [];
    let message = "";
    const validation = await validate(this.param, rules);
    if (validation.fails()) {
      status = false;
      message = validation.messages()[0].message;
      /* for (let error of validation.messages()) {
        message.push(error.message);
      } */
    }
    return [status, message];
  }

  env(key) {
    return Env.get(key, "");
  }

  uuid() {
    return uuidv4();
  }

  md5(text) {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  base64Encode(text) {
    const buffer = Buffer.from(text, "utf-8");
    return buffer.toString("base64");
  }

  base64Decode(text) {
    const buffer = Buffer.from(text, "base64");
    return buffer.toString("utf-8");
  }

  async finalProcess(outputs = {}) {
    OutputHelper.output(this.ctx.request, this.ctx.response, outputs);
  }

  async breakProcess(message = "") {
    //ErrorHelper.unauthorized(request, response);
    ErrorHelper.customError(this.ctx.request, this.ctx.response, 200, message);
  }

  async encrypt(text) {
    try {
      const key = Env.get("SERVICE_HASH", "");
      const salt = crypto.randomBytes(8);
      let salted = "";
      let dx = Buffer.alloc(0);

      while (salted.length < 48) {
        dx = Buffer.concat([dx, Buffer.from(key), salt]);
        dx = crypto.createHash("md5").update(dx).digest();
        salted += dx.toString("binary");
      }

      const encryptionKey = Buffer.from(salted, "binary").subarray(0, 32);
      const iv = Buffer.from(salted, "binary").subarray(32, 48);
      const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);

      let encrypted = cipher.update(JSON.stringify(text), "utf8", "base64");
      encrypted += cipher.final("base64");

      const data = {
        ct: encrypted,
        iv: iv.toString("hex"),
        s: salt.toString("hex"),
      };

      return [Buffer.from(JSON.stringify(data)).toString("base64"), null];
    } catch (error) {
      return [null, error];
    }
  }

  async decrypt(text) {
    try {
      const key = Env.get("SERVICE_HASH", "");
      const jsonData = JSON.parse(Buffer.from(text, "base64").toString("utf8"));
      const salt = Buffer.from(jsonData.s, "hex");
      const ct = jsonData.ct;
      const iv = Buffer.from(jsonData.iv, "hex");

      let concatedPassphrase = Buffer.concat([Buffer.from(key), salt]);
      let md5 = [crypto.createHash("md5").update(concatedPassphrase).digest()];
      let result = Buffer.from(md5[0]);

      for (let i = 1; i < 3; i++) {
        md5[i] = crypto
          .createHash("md5")
          .update(Buffer.concat([md5[i - 1], concatedPassphrase]))
          .digest();
        result = Buffer.concat([result, md5[i]]);
      }

      const decryptionKey = result.subarray(0, 32);
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        decryptionKey,
        iv
      );

      let decrypted = decipher.update(ct, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return [JSON.parse(decrypted), null];
    } catch (error) {
      return [null, error];
    }
  }
}

module.exports = ApiController;
