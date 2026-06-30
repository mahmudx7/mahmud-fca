"use strict";

/*

hut-chat-api based
Author by @MahMUD
Fixed autodismiss

*/
const utils = require("./utils");
// @MahMUD
let checkVerified = null;
let ctx = null;
let _defaultFuncs = null;
let api = null;
const errorRetrieving = "Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.";

function setOptions(globalOptions, options) {
  Object.keys(options).map(function(key) {
    switch (key) {
      case 'online':
        globalOptions.online = Boolean(options.online);
        break;
      case 'logLevel':
        globalOptions.logLevel = options.logLevel;
        break;
      case 'logRecordSize':
        globalOptions.logRecordSize = options.logRecordSize;
        break;
      case 'selfListen':
        globalOptions.selfListen = Boolean(options.selfListen);
        break;
      case 'selfListenEvent':
        globalOptions.selfListenEvent = options.selfListenEvent;
        break;
      case 'listenEvents':
        globalOptions.listenEvents = Boolean(options.listenEvents);
        break;
      case 'pageID':
        globalOptions.pageID = options.pageID.toString();
        break;
      case 'updatePresence':
        globalOptions.updatePresence = Boolean(options.updatePresence);
        break;
      case 'forceLogin':
        globalOptions.forceLogin = Boolean(options.forceLogin);
        break;
      case 'userAgent':
        globalOptions.userAgent = options.userAgent;
        break;
      case 'autoMarkDelivery':
        globalOptions.autoMarkDelivery = Boolean(options.autoMarkDelivery);
        break;
      case 'autoMarkRead':
        globalOptions.autoMarkRead = Boolean(options.autoMarkRead);
        break;
      case 'listenTyping':
        globalOptions.listenTyping = Boolean(options.listenTyping);
        break;
      case 'proxy':
        if (typeof options.proxy != "string") {
          delete globalOptions.proxy;
          utils.setProxy();
        } else {
          globalOptions.proxy = options.proxy;
          utils.setProxy(globalOptions.proxy);
        }
        break;
      case 'autoReconnect':
        globalOptions.autoReconnect = Boolean(options.autoReconnect);
        break;
      case 'emitReady':
        globalOptions.emitReady = Boolean(options.emitReady);
        break;
      default:
        console.warn("setOptions", "Unrecognized option given to setOptions: " + key);
        break;
    }
  });
}

let isBehavior = false;
async function bypassAutoBehavior(resp, jar, globalOptions, appstate, ID) {
  try {
    const appstateCUser = (appstate.find(i => i.key == 'c_user') || appstate.find(i => i.key == 'i_user'))
    const UID = ID || appstateCUser.value;
    const FormBypass = {
      av: UID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "FBScrapingWarningMutation",
      variables: JSON.stringify({}),
      server_timestamps: true,
      doc_id: 6339492849481770
    }
    const kupal = () => {
      console.warn(`login | ${UID}`, "We suspect automated behavior on your account.");
      if (!isBehavior) isBehavior = true;
    };
    if (resp) {
      if (resp.request.uri && resp.request.uri.href.includes("https://www.facebook.com/checkpoint/")) {
        if (resp.request.uri.href.includes('601051028565049')) {
          const fb_dtsg = utils.getFrom(resp.body, '["DTSGInitData",[],{"token":"', '","');
          const jazoest = utils.getFrom(resp.body, 'jazoest=', '",');
          const lsd = utils.getFrom(resp.body, "[\"LSD\",[],{\"token\":\"", "\"}");
          return utils.post("https://www.facebook.com/api/graphql/", jar, {
            ...FormBypass,
            fb_dtsg,
            jazoest,
            lsd
          }, globalOptions).then(utils.saveCookies(jar)).then(res => {
            kupal();
            return res;
          });
        } else return resp;
      } else return resp;
    } else {
      return utils.get('https://www.facebook.com/', jar, null, globalOptions).then(function(res) {
        if (res.request.uri && res.request.uri.href.includes("https://www.facebook.com/checkpoint/")) {
          if (res.request.uri.href.includes('601051028565049'))
            return { Status: true, body: res.body }
          else return { Status: true, body: res.body }
        } else return { Status: false, body: res.body }
      }).then(function(res) {
        if (res.Status) {
          const fb_dtsg = utils.getFrom(res.body, '["DTSGInitData",[],{"token":"', '","');
          const jazoest = utils.getFrom(res.body, 'jazoest=', '",');
          const lsd = utils.getFrom(res.body, "[\"LSD\",[],{\"token\":\"", "\"}");
          return utils.post("https://www.facebook.com/api/graphql/", jar, {
              ...FormBypass,
              fb_dtsg,
              jazoest,
              lsd
            }, globalOptions).then(utils.saveCookies(jar))
            .then(res => {
              kupal();
              return res;
            });
        } else return res;
      }).then(res => {
        return utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar))
      }).then(res => {
        return res;
      });
    }
  } catch (e) {
    console.error("error", e);
  }
}

function buildAPI(globalOptions, html, jar) {
  const maybeCookie = jar.getCookies("https://www.facebook.com").filter(function(val) {
    return val.cookieString().split("=")[0] === "c_user";
  });

  const objCookie = jar.getCookies("https://www.facebook.com").reduce(function(obj, val) {
    obj[val.cookieString().split("=")[0]] = val.cookieString().split("=")[1];
    return obj;
  }, {});

  if (maybeCookie.length === 0) {
    throw errorRetrieving;
  }

  if (html.indexOf("/checkpoint/block/?next") > -1) {
    console.warn("login", "Checkpoint detected. Please log in with a browser to verify.");
  }

  const userID = maybeCookie[0].cookieString().split("=")[1].toString();
  const i_userID = objCookie.i_user || null;
  console.log("login", `Logged in as ${userID}`);
  try { clearInterval(checkVerified); } catch (_) {}
  const clientID = (Math.random() * 2147483648 | 0).toString(16);
  const oldFBMQTTMatch = html.match(/irisSeqID:"(.+?)",appID:219994525426954,endpoint:"(.+?)"/);
  let mqttEndpoint, region, fb_dtsg, irisSeqID;
  try {
    const endpointMatch = html.match(/"endpoint":"([^"]+)"/);
    if (endpointMatch) {
      mqttEndpoint = endpointMatch[1].replace(/\\\//g, '/');
      const url = new URL(mqttEndpoint);
      region = url.searchParams.get('region')?.toUpperCase() || "PRN";
    }
    console.log('login', `Server region: ${region}`);
  } catch (e) {
    console.warn('login', 'Not MQTT endpoint');
  }
  const tokenMatch = html.match(/DTSGInitialData.*?token":"(.*?)"/);
  if (tokenMatch) {
    fb_dtsg = tokenMatch[1];
  }

  const ctx = {
    userID,
    jar,
    clientID,
    globalOptions,
    loggedIn: true,
    access_token: 'NONE',
    clientMutationId: 0,
    mqttClient: undefined,
    lastSeqId: irisSeqID,
    syncToken: undefined,
    mqttEndpoint,
    wsReqNumber: 0,
    wsTaskNumber: 0,
    reqCallbacks: {},
    region,
    firstListen: true,
    fb_dtsg
  };

  const defaultFuncs = utils.makeDefaults(html, i_userID || userID, ctx);
  return [ctx, defaultFuncs];
}

async function loginHelper(appState, email, password, globalOptions, apiCustomized = {}, callback) {
  let mainPromise = null;
  const jar = utils.getJar();
  console.log("login", 'Logging in...');
  if (appState) {
    if (utils.getType(appState) === 'Array' && appState.some(c => c.name)) {
      appState = appState.map(c => {
        c.key = c.name;
        delete c.name;
        return c;
      })
    }
    else if (utils.getType(appState) === 'String') {
      const arrayAppState = [];
      appState.split(';').forEach(c => {
        const [key, value] = c.split('=');
        arrayAppState.push({
          key: (key || "").trim(),
          value: (value || "").trim(),
          domain: ".facebook.com",
          path: "/",
          expires: new Date().getTime() + 1000 * 60 * 60 * 24 * 365
        });
      });
      appState = arrayAppState;
    }

    appState.map(function(c) {
      const str = c.key + "=" + c.value + "; expires=" + c.expires + "; domain=" + c.domain + "; path=" + c.path + ";";
      jar.setCookie(str, "http://" + c.domain);
    });

    mainPromise = utils
      .get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true })
      .then(utils.saveCookies(jar));
  } else {
    if (email) {
      throw "Currently, the login method by email and password is no longer supported, please use the login method by appState";
    }
    else {
      throw "No appState given.";
    }
  }

  api = {
    setOptions: setOptions.bind(null, globalOptions),
    getAppState: function getAppState() {
      const appState = utils.getAppState(jar);
      return appState.filter((item, index, self) => self.findIndex((t) => { return t.key === item.key }) === index);
    },
  }

  mainPromise = mainPromise
    .then(res => bypassAutoBehavior(res, jar, globalOptions, appState))
    .then(async res => {
      const url = `https://www.facebook.com/home.php`;
      const php = await utils.get(url, jar, null, globalOptions);
      const body = php?.body;
      return php;
    })
    .then(async (res) => {
      const html = res?.body;
      const stuff = buildAPI(globalOptions, html, jar);
      ctx = stuff[0];
      _defaultFuncs = stuff[1];
      require('fs').readdirSync(__dirname + '/src/').filter((v) => v.endsWith('.js')).map(function(v) {
        api[v.replace('.js', '')] = require('./src/' + v)(_defaultFuncs, api, ctx);
      });
      api.listen = api.listenMqtt;
      api.ws3 = {
        ...apiCustomized
      }
      return res;
    });
  if (globalOptions.pageID) {
    mainPromise = mainPromise
      .then(function() {
        return utils
          .get('https://www.facebook.com/' + ctx.globalOptions.pageID + '/messages/?section=messages&subsection=inbox', ctx.jar, null, globalOptions);
      })
      .then(function(resData) {
        let url = utils.getFrom(resData.body, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
        url = url.substring(0, url.length - 1);
        return utils
          .get('https://www.facebook.com' + url, ctx.jar, null, globalOptions);
      });
  }

  mainPromise
    .then(async () => {
      console.log("login", "Done logging in.");
      console.log("Author @MahMUD");
      console.log("WhatsApp: +8801836298139");
      console.log("Portfolio: https://mahmud-exe.onrender.com");
      try {
        const axios = require("axios");
        const res = await axios.get("https://raw.githubusercontent.com/mahmudx7/mahmud-fca/main/package.json");
        const latestVersion = res.data.version;
        const currentVersion = require("./package.json").version;
        if (latestVersion !== currentVersion) {
          console.log(`⚠️ New FCA update available: v${latestVersion}`);
          console.log("🔗 Update: https://github.com/mahmudx7/mahmud-fca");
        } else {
          console.log("✅ FCA is up to date!");
        }
      } catch(e) {}
      return callback(null, api);
    }).catch(e => callback(e));
}

async function login(loginData, options = {}, callback) {
  if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
    callback = options;
  }
  const globalOptions = {
    selfListen: false,
    selfListenEvent: false,
    listenEvents: false,
    listenTyping: false,
    updatePresence: false,
    forceLogin: false,
    autoMarkDelivery: false,
    autoMarkRead: true,
    autoReconnect: true,
    logRecordSize: 100,
    online: true,
    emitReady: false,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0"
  }
  setOptions(globalOptions, options);
  const wiegine = {
    relogin(){
      loginws3();
    }
  }
  async function loginws3() {
    loginHelper(loginData?.appState, loginData?.email, loginData?.password, globalOptions, wiegine,
      (loginError, loginApi) => {
        if (loginError) {
          if (isBehavior) {
            console.warn("login", "Failed after dismiss behavior, will relogin automatically...");
            isBehavior = false;
            loginws3();
          }
          console.error("login", loginError);
          callback(loginError);
        }
        callback(null, loginApi);
      });
  }
  const wie = await loginws3();
  return wie;
}

module.exports = login;
