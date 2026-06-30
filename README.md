# mahmud-fca 

> A modified & improved Facebook Chat API — Fixed and maintained by [@mahmudx7](https://github.com/mahmudx7)

---

## 👤 About

**mahmud-fca** is a Facebook Chat API modified with bug fixes, stability improvements, and extra features for Facebook Messenger bots.

---

## 📦 Install

```bash
npm install mahmud-fca
```

Or install directly from GitHub:

```bash
npm install github:mahmudx7/mahmud-fca
```

---

## 🚀 Example Usage

```js
const login = require("mahmud-fca");
const fs = require("fs");

login({
  appState: JSON.parse(fs.readFileSync("appstate.json", "utf8"))
}, (err, api) => {
  if (err) return console.error(err);

  api.listenMqtt((err, event) => {
    if (err) return console.error(err);

    if (event.type === "message") {
      api.sendMessage("Echo: " + event.body, event.threadID);
    }
  });
});
```

---

## ✨ Features & Changes

- ✅ **Auto relogin** — Automatically relogins when an error is detected
- ✅ **Auto dismiss behavior** — Detects and dismisses Facebook's automated behavior checkpoint
- ✅ **Added `api.relogin()`** — Manually trigger relogin
- ✅ **Added `api.stopListenMqtt()`** — Stop listening to MQTT
- ✅ **Added `api.getRegion()`** — Get the server region
- ✅ **Fixed `api.follow()`** and other API functions
- ✅ **Replaced npmlog** with normal `console.log` to fix render log issues
- ✅ **Supports cookie string, cookie array, and JSON appstate**

---

## 📖 API Reference

### `api.sendMessage(message, threadID[, callback][, messageID])`

Send a message to a thread. Message types:

| Type | Field |
|------|-------|
| Text | `body` |
| Sticker | `sticker` |
| File/Image | `attachment` (readable stream) |
| URL | `url` |
| Emoji | `emoji` + `emojiSize` |

---

### `api.listenMqtt(callback)`

Listen for messages and events. Enable events with:

```js
api.setOptions({ listenEvents: true });
```

Enable self-listen:

```js
api.setOptions({ selfListen: true });
```

---

### `api.getAppState()`

Returns the current appstate (cookies). Save it to avoid logging in every time:

```js
fs.writeFileSync("appstate.json", JSON.stringify(api.getAppState()));
```

---

### `api.stopListenMqtt()`

Stops listening to MQTT.

---

### `api.relogin()`

Manually triggers a relogin.

---

### `api.getRegion()`

Returns the current Facebook server region (e.g. `PRN`, `LLA`).

---

## ⚙️ Options

Pass options as the second argument to `login()`:

```js
login({ appState: [...] }, {
  selfListen: false,
  listenEvents: true,
  autoMarkRead: true,
  autoMarkDelivery: false,
  userAgent: "Mozilla/5.0 ...",
  online: true,
  autoReconnect: true
}, callback);
```

---

## 💾 Saving Session

```js
const fs = require("fs");
const login = require("mahmud-fca");

login({ appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) }, (err, api) => {
  if (err) return console.error(err);
  fs.writeFileSync("appstate.json", JSON.stringify(api.getAppState()));
});
```

---

## 📬 Contact

- 👤 GitHub: [@mahmudx7](https://github.com/mahmudx7)
- 💬 Facebook: [mahmudx7](https://facebook.com/mahmudx7)

---

## ⚠️ Disclaimer

This API is not affiliated with or endorsed by Facebook. Misuse may result in account bans. Use responsibly.

---

## 📄 License

[MIT](./LICENSE-MIT)
