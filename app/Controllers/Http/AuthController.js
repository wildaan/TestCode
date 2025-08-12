"use strict";

const ApiController = use("App/Controllers/Http/ApiController");
const SysClient = use("App/Models/SysClient");
const SysClientToken = use("App/Models/SysClientToken");
const SysUsers = use("App/Models/SysUsers");
const moment = require("moment");
const DB = use('Database')
const crypto =  require('crypto-js/sha256');

class AuthController extends ApiController {
  async connect({ request, response }) {
    if (!(await this.startProcess({ request, response }, "get"))) {
      return;
    }
    this.finalProcess();
  }

  async getAccessToken({ request, response }) {
    if (!(await this.startProcess({ request, response }, "post"))) {
      return;
    }

    if (this.appCode === null || this.email === null) {
      this.breakProcess("Hmmm Credential harus dikirim");
      return;
    }

    const thisTime = moment().format("YYYY-MM-DD HH:mm:ss");
    const client = await SysClient.query()
      .select("client_uuid")
      .where("client_appcode", this.appCode)
      .where("client_service", this.env("SERVICE_INITIAL"))
      .where("client_date_start", "<=", thisTime)
      .where(function (query) {
        query
          .whereRaw("client_date_end IS NULL")
          .orWhereRaw("client_date_end >= ?", [thisTime]);
      })
      .where("client_status", 1)
      .first();

    if (client === null) {
      this.breakProcess("AppCode tidak ditemukan");
      return;
    }

    const remember = this.param["remember"] === "1" ? 1 : 0;
    const hashtime = this.md5(new Date().getTime().toString());

    const generatedToken = this.base64Encode(
      this.md5(hashtime) +
        "-" +
        this.base64Encode(this.appCode) +
        "-" +
        this.base64Encode(this.email) +
        "-" +
        remember.toString()
    );

    const timeAdd =
      Math.floor(Date.now() / 1000) + 3600 * (remember === 1 ? 8600 : 1);

    const timeText = moment.unix(timeAdd).format("YYYY-MM-DD HH:mm:ss");

    request.CLITokenExpired = timeAdd;

    const dataInsert = {
      client_token_client_uuid: client.client_uuid,
      client_token_access: generatedToken,
      client_token_expire: timeText,
    };

    await SysClientToken.create(dataInsert);

    this.finalProcess({
      response: {
        access_token: generatedToken,
        expire: {
          time: timeAdd,
          text: timeText,
        },
      },
    });
  }

  async Login({ request, response }) {
    if (!(await this.startProcess({ request, response }, "post"))) {
      return;
    }
    const msisdn    = this.param['msisdn'] ? this.param['msisdn'] : null;
    const password  = this.param['password'] ? this.param['password'] : null;
    const encrypt   = crypto(password).toString();
    const users = await SysUsers.query()
                .select()
                .where("msisdn", msisdn)
                .where("user_password",encrypt)
                .first();
    let responses = {};
    if (users !== null) {
      const roles = users.user_roles == 1 ? "Admin" : "Users";
      const payload = {
        user_uuid: users.user_uuid,
        user_name: users.user_name,
        name : users.name,
        msisdn : users.msisdn,
        roles : roles
      };

      const [encodeText, _] = await this.encrypt(payload);

      responses = {
        tokenId: encodeText,
      };
    }
    else{
      responses = {
        message : "Data user tidak ditemukan"
      }
    }
    this.finalProcess({ response: responses });
  }

  async Loginbasic({ request, response }) {
    if (!(await this.startProcess({ request, response }, "post"))) {
      return;
    }
    const username    = this.param['username'] ? this.param['username'] : null;
    const password  = this.param['password'] ? this.param['password'] : null;
    const encrypt   = crypto(password).toString();
    const users = await SysUsers.query()
                .select()
                .where("user_name", username)
                .where("user_password",encrypt)
                .first();
    let responses = {};
    if (users !== null) {
      const roles = users.user_roles == 1 ? "Admin" : "Users";
      const payload = {
        user_uuid: users.user_uuid,
        user_name: users.user_name,
        name : users.name,
        msisdn : users.msisdn,
        roles : roles
      };

      const [encodeText, _] = await this.encrypt(payload);

      responses = {
        tokenId: encodeText,
      };
    }
    else{
      responses = {
        message : "Data user tidak ditemukan"
      }
    }
    this.finalProcess({ response: responses });
  }

  async Register({ request, response }) {
    if (!(await this.startProcess({ request, response }, "post"))) {
      return;
    }
    const name = this.param['name'] ? this.param['name'] : null;
    const username = this.param['username'] ? this.param['username'] : null;
    const password     = this.param['password'] ? this.param['password'] : null;
    const roles = this.param['roles'] ? this.param['roles'] : null
    if(name == null || username == null ||  password == null){
      return this.breakProcess('Semua field harus di isi');
    }
    
    const isUsernameExist = await SysUsers.query().select('user_name').where('user_name',username).first();
    if(isUsernameExist){
      return this.breakProcess('Username sudah digunakan');
    }
    const encrypt = crypto(password).toString();
    const datas = {
      user_uuid : this.uuid(),
      user_name : username,
      user_password : encrypt,
      user_status : 1,
      user_create_date : new Date(),
      name : name ,
      msisdn : this.Generatemsisdn(),
      user_roles : roles
    }
    const process = await DB.table('master.sys_users').insert(datas);
    let responses = {};
    if (process) {

      responses = {
        message : "Register data berhasil.."
      };
    }
    else{
      responses = {
        message : "Data user tidak ditemukan.."
      }
    }
    this.finalProcess({ response: responses });
  }

  async userprofile({ request, response }) {
    if (!(await this.startProcess({ request, response }, "post"))) {
      return;
    }
    this.finalProcess({
      response : this.userdata
    })
  }


  Generatemsisdn() {
    const prefix = '62';
    const length = 10 - prefix.length;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + result;
  }
}

module.exports = AuthController;
