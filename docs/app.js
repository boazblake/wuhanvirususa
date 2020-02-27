(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    var val = aliases[name];
    return (val && name !== val) ? expandAlias(val) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("app.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ramda = require("ramda");

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var toChartData = function toChartData(states) {
  var lastUpdated = (0, _moment["default"])(states[0].lastUpdate).format("YYYY-MM-DD");
  var lat = (0, _ramda.pluck)("lat", states);
  var lon = (0, _ramda.pluck)("long", states);
  var text = (0, _ramda.pluck)("text", states);
  var markerSize = (0, _ramda.zipWith)(_ramda.divide, (0, _ramda.pluck)("deaths", states), (0, _ramda.pluck)("confirmed", states));
  return [{
    type: "scattergeo",
    locationmode: "USA-states",
    lat: lat,
    lon: lon,
    hoverinfo: "text",
    text: text,
    lastUpdated: lastUpdated,
    marker: {
      size: markerSize.map((0, _ramda.multiply)(100)),
      line: {
        color: "black",
        width: 2
      }
    }
  }];
};

var formatState = function formatState(_ref) {
  var provinceState = _ref.provinceState,
      lat = _ref.lat,
      _long = _ref["long"],
      confirmed = _ref.confirmed,
      recovered = _ref.recovered,
      deaths = _ref.deaths,
      active = _ref.active,
      lastUpdate = _ref.lastUpdate;
  return {
    lat: lat,
    "long": _long,
    text: "".concat(provinceState, ": confirmed: ").concat(confirmed, ", recovered: ").concat(recovered, ", deaths: ").concat(deaths, ", active: ").concat(active),
    confirmed: confirmed,
    recovered: recovered,
    deaths: deaths,
    active: active,
    lastUpdate: lastUpdate
  };
};

var filterForUSA = function filterForUSA(countries) {
  return (0, _ramda.filter)((0, _ramda.propEq)("countryRegion", "US"), countries);
};

var toPlot = function toPlot(dom) {
  return function (details) {
    var USLayout = {
      title: "2020 US City WuHan virus Epidemic; last Updated: ".concat(details[0].lastUpdated),
      showlegend: false,
      geo: {
        scope: "usa",
        projection: {
          type: "albers usa"
        },
        showland: true,
        landcolor: "rgb(217, 217, 217)",
        subunitwidth: 1,
        countrywidth: 1,
        subunitcolor: "rgb(255,255,255)",
        countrycolor: "rgb(255,255,255)"
      }
    };
    Plotly.newPlot(dom, details, USLayout);
  };
};

var formatLocation = function formatLocation(locations) {
  return filterForUSA(locations).map(formatState);
};

var getDetailsAndPlot = function getDetailsAndPlot(_ref2) {
  var dom = _ref2.dom,
      mdl = _ref2.mdl,
      url = _ref2.url;

  var onSuccess = function onSuccess(mdl) {
    return function (details) {
      mdl.data.details = (0, _ramda.compose)(toPlot(dom), toChartData, formatLocation)(details);
    };
  };

  var onError = function onError(mdl) {
    return function (err) {
      mdl.err = err;
    };
  };

  m.request(url).then(onSuccess(mdl), onError(mdl));
};

var WuhanCrisis = function WuhanCrisis() {
  return {
    oncreate: function oncreate(_ref3) {
      var dom = _ref3.dom,
          mdl = _ref3.attrs.mdl;
      getDetailsAndPlot({
        dom: dom,
        mdl: mdl,
        url: mdl.data.wuhan.confirmed.detail
      });
    },
    view: function view() {
      return m(".container");
    }
  };
};

var IsLoading = m("svg[xmlns='http://www.w3.org/2000/svg'][xmlns:xlink='http://www.w3.org/1999/xlink'][width='200px'][height='200px'][viewBox='0 0 100 100'][preserveAspectRatio='xMidYMid']", {
  style: {
    margin: "auto",
    background: "rgb(241, 242, 243)",
    display: "block",
    "shape-rendering": "auto"
  }
}, m("path[d='M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50'][fill='#85a2b6'][stroke='none'][transform='rotate(17.5738 50 51)']", m("animateTransform[attributeName='transform'][type='rotate'][dur='1s'][repeatCount='indefinite'][keyTimes='0;1'][values='0 50 51;360 50 51']")));

var loadWuhanVirusData = function loadWuhanVirusData(mdl) {
  var onError = function onError(mdl) {
    return function (err) {
      return mdl.err.wuhan = err;
    };
  };

  var onSuccess = function onSuccess(mdl) {
    return function (data) {
      return mdl.data.wuhan = data;
    };
  };

  m.request("https://covid19.mathdro.id/api").then(onSuccess(mdl), onError(mdl));
};

var wuhanStyle = function wuhanStyle(mdl) {
  return {
    // backgroundImage: `url(${mdl.data.wuhan.image}) center`,
    height: "100vh",
    width: "100vw"
  };
};

var WuhanVirus = function WuhanVirus(mdl) {
  return {
    oninit: function oninit() {
      return loadWuhanVirusData(mdl);
    },
    view: function view() {
      return mdl.data.wuhan ? m(".container", {
        style: wuhanStyle(mdl)
      }, [m(WuhanCrisis, {
        mdl: mdl
      })]) : IsLoading;
    }
  };
};

var _default = WuhanVirus;
exports["default"] = _default;
});

;require.register("index.js", function(exports, require, module) {
"use strict";

var _app = _interopRequireDefault(require("./app.js"));

var _model = _interopRequireDefault(require("./model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var root = document.body;
var winW = window.innerWidth;

if (module.hot) {
  module.hot.accept();
}

if ('development' !== "production") {
  console.log("Looks like we are in development mode!");
} else {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").then(function (registration) {
        console.log("⚙️ SW registered: ", registration);
      })["catch"](function (registrationError) {
        console.log("🧟 SW registration failed: ", registrationError);
      });
    });
  }
} // set display profiles


var getProfile = function getProfile(w) {
  if (w < 668) return "phone";
  if (w < 920) return "tablet";
  return "desktop";
};

var checkWidth = function checkWidth(winW) {
  var w = window.innerWidth;

  if (winW !== w) {
    winW = w;
    var lastProfile = _model["default"].settings.profile;
    _model["default"].settings.profile = getProfile(w);
    if (lastProfile != _model["default"].settings.profile) m.redraw();
  }

  return requestAnimationFrame(checkWidth);
};

_model["default"].settings.profile = getProfile(winW);
checkWidth(winW);
m.mount(root, (0, _app["default"])(_model["default"]));
});

;require.register("initialize.js", function(exports, require, module) {
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  require("./index.js");
});
});

;require.register("model.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var model = {
  data: {
    wuhan: null,
    details: null
  },
  err: null,
  state: null,
  settings: {}
};
var _default = model;
exports["default"] = _default;
});

;require.register("___globals___", function(exports, require, module) {
  

// Auto-loaded modules from config.npm.globals.
window.m = require("mithril");
window.Stream = require("mithril-stream");


});})();require('___globals___');


//# sourceMappingURL=app.js.map