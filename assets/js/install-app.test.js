const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const SCRIPT = fs.readFileSync("assets/js/install-app.js", "utf8");
const MANIFEST = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
const SERVICE_WORKER = fs.readFileSync("service-worker.js", "utf8");

function createButton() {
  const label = createElement("span");
  label.className = "app-install-button__label";
  label.textContent = "ติดตั้งแอป";

  const button = createElement("button");
  button.hidden = true;
  button.children.push(label);

  return button;
}

function createElement(tagName) {
  const listeners = {};
  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    className: "",
    classList: {
      values: [],
      add(value) {
        this.values.push(value);
      },
      remove(value) {
        this.values = this.values.filter(function (item) {
          return item !== value;
        });
      }
    },
    dataset: {},
    disabled: false,
    hidden: false,
    textContent: "",
    attributes: {},
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name.indexOf("data-") === 0) {
        this.dataset[name.slice(5).replace(/-([a-z])/g, function (_, char) {
          return char.toUpperCase();
        })] = String(value);
      }
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    focus() {
      this.focused = true;
    },
    closest(selector) {
      return this.matches && this.matches(selector) ? this : null;
    },
    matches(selector) {
      return Boolean(this.attributes[selector.slice(1, -1)]);
    },
    querySelector(selector) {
      if (selector === ".app-install-button__label") {
        return this.children.find(function (child) {
          return child.className === "app-install-button__label";
        }) || null;
      }

      if (selector === "[data-ios-install-intro]") {
        return this.iosIntro || null;
      }

      if (selector === "[data-install-dialog-close]") {
        return this.closeButton || null;
      }

      return null;
    },
    dispatch(type) {
      (listeners[type] || []).forEach(function (handler) {
        handler({ target: element, key: type === "keydown" ? "Escape" : "" });
      });
    }
  };

  Object.defineProperty(element, "innerHTML", {
    set() {
      this.iosIntro = createElement("p");
      this.closeButton = createElement("button");
      this.closeButton.setAttribute("data-install-dialog-close", "");
    }
  });

  return element;
}

function createEnvironment(options = {}) {
  const windowListeners = {};
  const documentListeners = {};
  const button = createButton();
  const body = createElement("body");
  const registerCalls = [];
  const consoleMessages = [];

  const window = {
    console: {
      info() {
        consoleMessages.push(Array.prototype.slice.call(arguments));
      }
    },
    location: {
      hostname: options.hostname || "127.0.0.1",
      search: options.search || ""
    },
    navigator: {
      platform: options.platform || "Win32",
      maxTouchPoints: options.maxTouchPoints || 0,
      standalone: Boolean(options.iosStandalone),
      userAgent: options.userAgent || "Mozilla/5.0 Chrome Safari",
      serviceWorker: {
        register(path, config) {
          registerCalls.push({ path, config });
          return Promise.resolve();
        }
      }
    },
    matchMedia() {
      return { matches: Boolean(options.standalone) };
    },
    addEventListener(type, handler) {
      windowListeners[type] = windowListeners[type] || [];
      windowListeners[type].push(handler);
    },
    setTimeout(handler) {
      window.lastTimeout = handler;
      return 1;
    },
    clearTimeout() {},
    localStorage: {
      values: {},
      setItem(key, value) {
        this.values[key] = value;
      }
    }
  };

  const document = {
    body,
    activeElement: button,
    createElement,
    querySelectorAll(selector) {
      return selector === "[data-install-app]" ? [button] : [];
    },
    addEventListener(type, handler) {
      documentListeners[type] = documentListeners[type] || [];
      documentListeners[type].push(handler);
    }
  };

  const context = { window, document, navigator: window.navigator };
  vm.runInNewContext(SCRIPT, context);

  function dispatchDocument(type) {
    (documentListeners[type] || []).forEach(function (handler) {
      handler();
    });
  }

  function dispatchWindow(type, event) {
    (windowListeners[type] || []).forEach(function (handler) {
      handler(event || {});
    });
  }

  dispatchDocument("DOMContentLoaded");

  return { button, body, window, dispatchWindow, registerCalls, consoleMessages };
}

function createBeforeInstallPrompt(outcome) {
  return {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    promptCalled: false,
    prompt() {
      this.promptCalled = true;
      return Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome })
  };
}

function labelText(button) {
  return button.querySelector(".app-install-button__label").textContent;
}

function flushPromises() {
  return Promise.resolve()
    .then(function () {
      return Promise.resolve();
    })
    .then(function () {
      return Promise.resolve();
    })
    .then(function () {
      return Promise.resolve();
    });
}

async function run() {
  {
    const env = createEnvironment();
    assert.strictEqual(env.button.hidden, true, "no beforeinstallprompt should keep Android button hidden");
  }

  {
    const env = createEnvironment();
    const prompt = createBeforeInstallPrompt("dismissed");
    env.dispatchWindow("beforeinstallprompt", prompt);
    assert.strictEqual(prompt.defaultPrevented, true);
    assert.strictEqual(env.button.hidden, false, "beforeinstallprompt should show button");
  }

  {
    const env = createEnvironment();
    const prompt = createBeforeInstallPrompt("accepted");
    env.dispatchWindow("beforeinstallprompt", prompt);
    env.button.dispatch("click");
    await flushPromises();
    assert.strictEqual(prompt.promptCalled, true);
    assert.strictEqual(env.button.hidden, false, "accepted should not hide before appinstalled");
    assert.strictEqual(env.button.disabled, true);
    assert.strictEqual(labelText(env.button), "กำลังติดตั้ง...");
    assert.notStrictEqual(env.body.children.find(function (child) {
      return child.dataset && child.dataset.installAppStatus !== undefined;
    }).textContent, "ติดตั้งแอปสำเร็จ");
  }

  {
    const env = createEnvironment();
    const prompt = createBeforeInstallPrompt("dismissed");
    env.dispatchWindow("beforeinstallprompt", prompt);
    env.button.dispatch("click");
    await flushPromises();
    assert.strictEqual(env.button.disabled, false);
    assert.strictEqual(labelText(env.button), "ติดตั้งแอป");
    assert.strictEqual(env.button.hidden, true, "dismissed clears consumed deferred prompt");
  }

  {
    const env = createEnvironment();
    env.dispatchWindow("beforeinstallprompt", createBeforeInstallPrompt("accepted"));
    env.button.dispatch("click");
    await flushPromises();
    env.dispatchWindow("appinstalled");
    const liveRegion = env.body.children.find(function (child) {
      return child.dataset && child.dataset.installAppStatus !== undefined;
    });
    assert.strictEqual(env.button.hidden, true);
    assert.strictEqual(liveRegion.textContent, "ติดตั้งแอปสำเร็จ");
  }

  {
    const env = createEnvironment({ standalone: true });
    env.dispatchWindow("beforeinstallprompt", createBeforeInstallPrompt("dismissed"));
    assert.strictEqual(env.button.hidden, true, "standalone mode should hide button");
  }

  {
    const env = createEnvironment({
      platform: "iPhone",
      userAgent: "Mozilla/5.0 iPhone Safari",
      maxTouchPoints: 1
    });
    assert.strictEqual(env.button.hidden, false, "iOS should show guide button");
    env.button.dispatch("click");
    assert.strictEqual(labelText(env.button), "ติดตั้งแอป", "iOS must not show installing state");
    const dialog = env.body.children.find(function (child) {
      return child.className === "install-dialog";
    });
    assert.strictEqual(dialog.hidden, false);
  }

  assert(MANIFEST.icons.some(function (icon) {
    return icon.sizes === "192x192" && icon.src === "/assets/icons/icon-192.png";
  }), "manifest should include 192 icon");
  assert(MANIFEST.icons.some(function (icon) {
    return icon.sizes === "512x512" && icon.src === "/assets/icons/icon-512.png";
  }), "manifest should include 512 icon");
  assert.strictEqual(MANIFEST.start_url.indexOf(MANIFEST.scope), 0, "start_url should be in scope");
  MANIFEST.icons.forEach(function (icon) {
    assert(fs.existsSync(icon.src.replace(/^\//, "")), "icon URL should exist: " + icon.src);
  });
  assert(SERVICE_WORKER.indexOf('register("/service-worker.js"') === -1, "service worker registration belongs in install-app.js");

  {
    const env = createEnvironment();
    env.dispatchWindow("load");
    await flushPromises();
    assert.strictEqual(env.registerCalls[0].path, "/service-worker.js");
    assert.strictEqual(env.registerCalls[0].config.scope, "/");
  }

  console.log("install-app tests passed");
}

run().catch(function (error) {
  console.error(error);
  process.exit(1);
});
