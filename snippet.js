(function () {
  function _vwo_err(e) {
    function gE(e, a) {
      return (
        "https://dev.visualwebsiteoptimizer.com/ee.gif?a=737109&s=j.php&_cu=" +
        encodeURIComponent(window.location.href) +
        "&e=" +
        encodeURIComponent(
          e && e.message && e.message.substring(0, 1000) + "&vn="
        ) +
        (e && e.code ? "&code=" + e.code : "") +
        (e && e.type ? "&type=" + e.type : "") +
        (e && e.status ? "&status=" + e.status : "") +
        (a || "")
      );
    }
    var vwo_e = gE(e);
    try {
      typeof navigator.sendBeacon === "function"
        ? navigator.sendBeacon(vwo_e)
        : (new Image().src = vwo_e);
    } catch (err) {}
  }
  try {
    var extE = 0,
      prevMode = false;
    window._VWO_Jphp_StartTime =
      window.performance && typeof window.performance.now === "function"
        ? window.performance.now()
        : new Date().getTime();
    (function () {
      window._VWO = window._VWO || {};
      var aC = window._vwo_code;
      if (typeof aC === "undefined") {
        window._vwo_mt = "dupCode";
        return;
      }
      if (window._VWO.sCL) {
        window._vwo_mt = "dupCode";
        window._VWO.sCDD = true;
        try {
          if (aC) {
            clearTimeout(window._vwo_settings_timer);
            var h = document.querySelectorAll("#_vis_opt_path_hides");
            var x = h[h.length > 1 ? 1 : 0];
            x && x.remove();
          }
        } catch (e) {}
        return;
      }
      window._VWO.sCL = true;
      window._vwo_mt = "live";
      var localPreviewObject = {};
      var previewKey = "_vis_preview_" + 737109;
      var wL = window.location;
      try {
        localPreviewObject[previewKey] =
          window.localStorage.getItem(previewKey);
        JSON.parse(localPreviewObject[previewKey]);
      } catch (e) {
        localPreviewObject[previewKey] = "";
      }
      try {
        window._vwo_tm = "";
        var getMode = function (e) {
          var n;
          if (window.name.indexOf(e) > -1) {
            n = window.name;
          } else {
            n = wL.search.match("_vwo_m=([^&]*)");
            n = n && atob(decodeURIComponent(n[1]));
          }
          return n && JSON.parse(n);
        };
        var ccMode = getMode("_vwo_cc");
        if (
          window.name.indexOf("_vis_heatmap") > -1 ||
          window.name.indexOf("_vis_editor") > -1 ||
          ccMode ||
          window.name.indexOf("_vis_preview") > -1
        ) {
          try {
            if (ccMode) {
              window._vwo_mt = decodeURIComponent(
                wL.search.match("_vwo_m=([^&]*)")[1]
              );
            } else if (window.name && JSON.parse(window.name)) {
              window._vwo_mt = window.name;
            }
          } catch (e) {
            if (window._vwo_tm) window._vwo_mt = window._vwo_tm;
          }
        } else if (window._vwo_tm.length) {
          window._vwo_mt = window._vwo_tm;
        } else if (
          location.href.indexOf("_vis_opt_preview_combination") !== -1 &&
          location.href.indexOf("_vis_test_id") !== -1
        ) {
          window._vwo_mt = "sharedPreview";
        } else if (localPreviewObject[previewKey]) {
          window._vwo_mt = JSON.stringify(localPreviewObject);
        }
        if (window._vwo_mt !== "live") {
          if (typeof extE !== "undefined") {
            extE = 1;
          }
          if (!getMode("_vwo_cc")) {
            _vwo_code.load(
              "https://dev.visualwebsiteoptimizer.com/j.php?mode=" +
                encodeURIComponent(window._vwo_mt) +
                "&a=737109&f=1&u=" +
                encodeURIComponent(window._vis_opt_url || document.URL) +
                "&eventArch=true" +
                "&x=true",
              {
                sL: window._vwo_code.sL,
              }
            );
            if (window._vwo_code.sL) {
              prevMode = true;
            }
          } else {
            (function () {
              window._vwo_code && window._vwo_code.finish();
              _vwo_ccc = {
                u: "/j.php?a=737109&u=https%3A%2F%2Fwww.boozt.com%2Feu%2Fen%2Flogin&vn=2.1&x=true",
              };
              var s = document.createElement("script");
              s.src =
                "https://app.vwo.com/visitor-behavior-analysis/dist/codechecker/cc.min.js?r=" +
                Math.random();
              document.head.appendChild(s);
            })();
          }
        }
      } catch (e) {
        var vwo_e = new Image();
        vwo_e.src =
          "https://dev.visualwebsiteoptimizer.com/ee.gif?s=mode_det&e=" +
          encodeURIComponent(
            e && e.stack && e.stack.substring(0, 1000) + "&vn="
          );
        aC && window._vwo_code.finish();
      }
    })();
    window._vwo_cookieDomain = "boozt.com";
    _vwo_surveyAssetsBaseUrl = "https://cdn.visualwebsiteoptimizer.com/";
    if (prevMode) {
      return;
    }
    if (window._vwo_mt === "live") {
      window.VWO = window.VWO || [];
      window._vwo_acc_id = 737109;
      window.VWO._ = window.VWO._ || {};
      window.VWO.visUuid =
        "DD436B67FAA7F2E6C9536D47F36598CA1|75c9a0d4f257652433c5e8b9314c5f29";
      _vwo_code.sT = _vwo_code.finished();
      window.VWO = window.VWO || [];
      window.VWO.consentMode = window.VWO.consentMode || {};
      window.VWO.consentMode.vTC = function (c, a, e, d, b, z, g) {
        function f(a, b, d) {
          e.cookie =
            a +
            "=" +
            b +
            "; expires=" +
            new Date(86400000 * d + +new Date()).toGMTString() +
            "; domain=" +
            g +
            "; path=/";
        }
        -1 == e.cookie.indexOf("_vis_opt_out") &&
          -1 == d.location.href.indexOf("vwo_opt_out=1") &&
          ((a =
            e.cookie.replace(
              /(?:(?:^|.*;\s*)_vwo_uuid_v2\s*=\s*([^;]*).*$)|^.*$/,
              "$1"
            ) || a),
          (a = a.split("|")),
          (b = new Image()),
          (g =
            window._vis_opt_domain ||
            c ||
            d.location.hostname.replace(/^www\./, "")),
          (b.src =
            "https://dev.visualwebsiteoptimizer.com/eu01/v.gif?cd=" +
            (window._vis_opt_cookieDays || 0) +
            "&a=737109&d=" +
            encodeURIComponent(d.location.hostname.replace(/^www\./, "") || c) +
            "&u=" +
            a[0] +
            "&h=" +
            a[1] +
            "&t=" +
            z),
          (d.vwo_iehack_queue = [b]),
          f("_vwo_uuid_v2", a.join("|"), 366));
      }.bind(
        null,
        "boozt.com",
        window.VWO.visUuid,
        document,
        window,
        0,
        _vwo_code.sT
      );
      clearTimeout(window._vwo_settings_timer);
      window._vwo_settings_timer = null;
      var vwoCode = window._vwo_code;
      if (
        vwoCode.filterConfig &&
        vwoCode.filterConfig.filterTime === "balanced"
      ) {
        vwoCode.removeLoaderAndOverlay();
      }
      var vwo_CIF = false;
      var UAP = false;
      var splitXpath = (function () {
        var u = window.sessionStorage.getItem("_vwo_split_redirect");
        return u && u === (window._vis_opt_url || window.location.href)
          ? ""
          : "body";
      })();
      var _vwo_style = document.getElementById("_vis_opt_path_hides"),
        _vwo_css =
          (vwoCode.hide_element_style
            ? vwoCode.hide_element_style()
            : "{opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important;}") +
          ":root {--vwo-el-opacity:0 !important;--vwo-el-filter:alpha(opacity=0) !important;--vwo-el-bg:none !important;--vwo-el-ts:none !important;}",
        _vwo_text = "" + splitXpath + _vwo_css;
      window.VWO = window.VWO || [];
      window.VWO.consentMode = window.VWO.consentMode || {};
      window.VWO.consentMode.hideVwoText = function () {
        if (_vwo_style) {
          var e =
            _vwo_style.classList.contains("_vis_hide_layer") && _vwo_style;
          if (UAP && !UAP() && vwo_CIF && !vwo_CIF()) {
            e
              ? e.parentNode.removeChild(e)
              : _vwo_style.parentNode.removeChild(_vwo_style);
          } else {
            if (e) {
              var t = (_vwo_style = document.createElement("style")),
                o = document.getElementsByTagName("head")[0],
                s = document.querySelector("#vwoCode");
              t.setAttribute("id", "_vis_opt_path_hides"),
                s && t.setAttribute("nonce", s.nonce),
                t.setAttribute("type", "text/css"),
                o.appendChild(t);
            }
            if (_vwo_style.styleSheet)
              _vwo_style.styleSheet.cssText = _vwo_text;
            else {
              var l = document.createTextNode(_vwo_text);
              _vwo_style.appendChild(l);
            }
            e
              ? e.parentNode.removeChild(e)
              : _vwo_style.removeChild(_vwo_style.childNodes[0]);
          }
        }
      };
      window.VWO.ssMeta = {
        enabled: 0,
        noSS: 0,
      };
      (function () {
        window.VWO = window.VWO || [];
        var i = (window.VWO.consentMode = window.VWO.consentMode || {});
        function s(e, t) {
          true
            ? window.VWO._ &&
              window.VWO._.phoenixMT &&
              window.VWO._.phoenixMT.trigger(e)
            : window.VWO.consentMode[t] && window.VWO.consentMode[t]();
        }
        function n() {
          (i.tLocked = !0), [i.cTTimer, i.popupTimer].forEach(clearInterval);
        }
        (i.tLocked = !1),
          (i.iLocked = !1),
          (i.states = {
            ACCEPTED: 1,
            PENDING: 2,
            REJECTED: 3,
          }),
          i.hideVwoText || (i.hideVwoText = () => {}),
          (i.cConfig = {
            pS: "#didomi-host",
            bE: true,
            cT: 3000,
            cPB: "B",
            eT: true,
          }),
          (i.cookieName = "_vwo_consent"),
          (i.domain =
            window._vis_opt_domain ||
            window._vwo_cookieDomain ||
            window.location.host),
          (window.VWO.init = function (e) {
            var t,
              o,
              { iState: e, tState: n } = (function (e) {
                var t = i.getState().split(",");
                if ("object" == typeof e && null !== e)
                  return {
                    iState: e.i || parseInt(t[0], 10),
                    tState: e.t || parseInt(t[1], 10),
                  };
                t = parseInt(e, 10);
                return {
                  iState: t,
                  tState: t,
                };
              })(e);
            (o = n),
              (t = e) &&
                o &&
                (t != i.states.PENDING || o != i.states.PENDING) &&
                (i.setState(e + "," + n),
                (function (e) {
                  if (i.cConfig.eT) {
                    if (e == i.states.REJECTED)
                      return (
                        i.processRejected(e), s("cCR", "onConsentRejected")
                      );
                    e == i.states.ACCEPTED &&
                      "B" !== i.cConfig.cPB &&
                      ((i.hT = !1),
                      (i.cCA = !0),
                      (i.dT = !1),
                      s("cCA", "onConsentAccepted")),
                      "B" === i.cConfig.cPB &&
                        !(function (e) {
                          i.tLocked ||
                            (e == i.states.ACCEPTED &&
                              i.cConfig.bE &&
                              "undefined" != typeof _vwo_text &&
                              i.hideVwoText(),
                            i.handleBlockState(e));
                        })(e);
                  }
                })(n),
                i.handleInsightsState(e));
          }),
          (i.handleBlockState = function (e) {
            var { ACCEPTED: t, REJECTED: o } = i.states;
            e == t
              ? (s("cCA", "onConsentAccepted"), i.initLoad(e), n())
              : e == o && i.processRejected(e);
          }),
          (i.handleInsightsState = function (e) {
            var { ACCEPTED: t, REJECTED: o } = i.states;
            i.iLocked ||
              (e == t
                ? ((i.hTI = !1),
                  s("cCAI", "onInsightsConsentAccepted"),
                  (i.iLocked = !0))
                : e == o
                ? i.insightsRejected()
                : (i.hTI = !0));
          }),
          (i.handleState = function (e) {
            var { ACCEPTED: t, REJECTED: o } = i.states;
            (e != t && e != o) || i[e == t ? "initLoad" : "processRejected"](e);
          }),
          (i.handleBlock = function (e, t) {
            var o;
            t.eT &&
              ((this.cConfig.cT <= 0 || null === this.cConfig.cT) &&
              e == this.states.PENDING
                ? ((i.dT = !0),
                  (i.tLocked = !0),
                  (o = document.getElementById("_vis_opt_path_hides")) &&
                    o.parentNode.removeChild(o),
                  this.handleState(this.states.PENDING))
                : (this.hideForBlock(e, t), this.handleBlockState(e)));
          }),
          (i.hideForBlock = function (e, t) {
            if (null === e || e == this.states.PENDING) {
              this.setTimerAndApplyFilter(t);
              try {
                var o = "undefined" != typeof _vwo_text ? _vwo_text : "";
              } catch (e) {}
              -1 !== o.indexOf("body")
                ? (t = document.getElementById("_vis_opt_path_hides")) &&
                  (t.removeAttribute("style"),
                  "style" === t.tagName.toLowerCase()) &&
                  (t.textContent = "")
                : this.hideVwoText();
            } else e == this.states.ACCEPTED && this.hideVwoText();
          }),
          (i.handleOtherModes = function (e) {
            if (!e || e == this.states.PENDING) return this.initLoad(e);
            this.handleState(e);
          }),
          (i.selectMode = function (e) {
            var t = this.states;
            if (!e)
              return (
                this.processRejected(t.REJECTED) && this.insightsRejected()
              );
            var [o, n] = this.getState().split(",");
            e.eT
              ? ((window.VWO.consentMode.cReady = !1),
                "A" === e.cPB && n != t.REJECTED && i.vTC && i.vTC(),
                "B" === e.cPB
                  ? this.handleBlock(n, e)
                  : this.handleOtherModes(n))
              : i.vTC && i.vTC(),
              this.handleInsightsState(o);
          }),
          (i.setTimerAndApplyFilter = function (e) {
            if (e.cT)
              try {
                i.applyFilters(e),
                  (i.popupTimer = setInterval(function () {
                    i.applyFilters(e) && clearInterval(i.popupTimer);
                  }, 100)),
                  (i.cTTimer = setTimeout(function () {
                    (i.tLocked = !0),
                      (i.iLocked = !0),
                      (i.timeOut = !0),
                      true
                        ? window.VWO._ &&
                          window.VWO._.phoenixMT &&
                          window.VWO._.phoenixMT.trigger("cCT")
                        : i.onConsentTimeout && i.onConsentTimeout(),
                      i.processRejected(i.states.REJECTED),
                      clearInterval(i.popupTimer);
                  }, e.cT));
              } catch (e) {}
          }),
          (i.setState = function (e) {
            let t = [];
            var o,
              n = document.cookie
                .split("; ")
                .find((e) => e.startsWith("_vwo_consent=")),
              n =
                (n &&
                  (([o, ...n] = decodeURIComponent(n.split("=")[1]).split(":")),
                  (t = n)),
                encodeURIComponent(e + ":" + t.join(":")));
            this.setCookie(n);
          }),
          (i.getState = function () {
            var o = document.cookie.match(
              "(^|;)\\s*" + this.cookieName + "=\\s*([^;]+)"
            );
            if (o) {
              let [e, t] = decodeURIComponent(o[2]).split(":")[0].split(",");
              return (t && e) || ((t = e || "2"), (e = t)), e + "," + t;
            }
            return (o = encodeURIComponent("2,2:~")), this.setCookie(o), "2,2";
          }),
          (i.setCookie = function (e) {
            var e = `_vwo_consent=${e}; path=/;domain=.${this.domain};max-age=31536000`,
              t = window.VWO.ssMeta;
            t &&
              t.enabled &&
              !t.noSS &&
              (e += "; secure; samesite=none; Partitioned;"),
              (document.cookie = e);
          }),
          (i.initLoad = function (e) {
            if (!window.VWO.consentMode.cReady)
              if (
                ((window.VWO.consentMode.cReady = !0),
                window.VWO.initVWOLib && window.VWO.initVWOLib(),
                e != i.states.PENDING ||
                  ("P" !== i.cConfig.cPB && "B" !== i.cConfig.cPB))
              )
                (i.hT = !1),
                  i.vTC && i.vTC(),
                  i.processRejected(e),
                  e == i.states.REJECTED && (i.dT = !0),
                  (i.cCA = e == i.states.ACCEPTED);
              else {
                "P" === i.cConfig.cPB && (i.hT = !0), (i.deferredQueue = []);
                const t =
                  "undefined" != typeof _vwo_code && _vwo_code.finished();
                i.deferredQueue.push({
                  method: "fn",
                  payload: () => {
                    if ("undefined" == typeof _vwo_code)
                      return i.vTC && i.vTC();
                    var e = window._vwo_code.finished;
                    (window._vwo_code.finished = () => t || !1),
                      i.vTC && i.vTC(),
                      (window._vwo_code.finished = e);
                  },
                });
              }
          }),
          (i.applyFilters = function (e) {
            try {
              var t = window._vwo_code && _vwo_text === _vwo_css;
              if (!t) {
                var o,
                  n,
                  i,
                  s,
                  d,
                  c,
                  a,
                  r,
                  l,
                  h,
                  _ = document.querySelector(e.pS);
                if (_ || !document.getElementById("_vis_opt_overlay"))
                  return (
                    (o = 2147483647),
                    _ &&
                      (((n = window
                        .getComputedStyle(_)
                        .getPropertyValue("z-index")) &&
                        "auto" !== n) ||
                        (n = o),
                      (_.style.zIndex = n)),
                    (i =
                      "position: fixed; top: 0; left: 0; right: 0; bottom: 0; height: 100%; width: 100%;-webkit-filter: blur(5px); filter: blur(5px); backdrop-filter: saturate(180%) blur(3px); -webkit-backdrop-filter: saturate(180%) blur(3px); z-index:" +
                      ((n = n || o) - 1) +
                      ";"),
                    (s = document.getElementById("_vis_opt_overlay")),
                    (d = e.bE ? ".vwo-overlay {" + i + "}" : ""),
                    s
                      ? s.styleSheet
                        ? (s.styleSheet.cssText = d)
                        : ((c = document.createTextNode(d)),
                          s.appendChild(c),
                          s.removeChild(s.childNodes[0]))
                      : ((a = document.createElement("style")),
                        (r = document.getElementsByTagName("head")[0]),
                        (l = document.getElementsByTagName("body")[0]),
                        (h = document.createElement("div")).classList.add(
                          "vwo-overlay"
                        ),
                        l.prepend(h),
                        a.setAttribute("id", "_vis_opt_overlay"),
                        a.setAttribute("type", "text/css"),
                        a.styleSheet
                          ? (a.styleSheet.cssText = d)
                          : a.appendChild(document.createTextNode(d)),
                        r.appendChild(a)),
                    !!_
                  );
              }
            } catch (e) {}
          }),
          (i.insightsRejected = function () {
            (i.dTI = !0),
              s("cCRI", "onInsightsConsentRejected"),
              (i.iLocked = !0);
          }),
          (i.processRejected = function (e) {
            e == i.states.REJECTED &&
              ((i.dT = !0),
              document
                .querySelectorAll('[id^="_vis_opt_path_hides"]')
                .forEach((e) => e && e.parentNode.removeChild(e)));
            var e = document.getElementsByClassName("vwo-overlay"),
              t = document.getElementsByClassName("vwo-content-loader"),
              o = document.getElementById("_vis_opt_overlay");
            (e = e && e[0]) && e.parentElement.removeChild(e),
              (t = t && t[0]) && t.parentElement.removeChild(t),
              o && o.parentElement.removeChild(o),
              n();
          }),
          ("B" === i.cConfig.cPB && i.cConfig.eT) || i.hideVwoText();
        try {
        } catch (e) {
          "function" == typeof _vwo_err && _vwo_err(e);
        }
        i.selectMode(i.cConfig),
          window.VWO.consentState && window.VWO.init(window.VWO.consentState);
      })();
      VWO._ = VWO._ || {};
      window._vwo_clicks = false;
      VWO._.allSettings = (function () {
        return {
          dataStore: {
            campaigns: {
              509: {
                version: 2,
                ep: 1741601947000,
                clickmap: 0,
                globalCode: [],
                type: "ANALYZE_RECORDING",
                status: "RUNNING",
                pc_traffic: 100,
                name: "PDP (all) - WIHA",
                manual: false,
                main: false,
                urlRegex: "^https\\:\\/\\/boozt\\.com\\/.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code:
                  "(_vwo_t.cm('eO', 'poll','_vwo_s().dv(\\'f_in\\',\\'page_type\\',\\'product\\')'))",
                ss: {
                  pu: "_vwo_u.cm('eO','js','1')",
                  csa: 0,
                  js: {
                    1: "// Example Code: This code will stop polling after 5 sec of dom ready (on calling executeTrigger() method)\nfunction() {\n    vwo_$(document).ready(function () {\n        // Waiting for 5 more seconds\n        setTimeout(function () {\n            // Call this method to stop the polling\n            executeTrigger();\n        }, 5000);\n    });\n}\n",
                  },
                },
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    urlRegex: "^.*$",
                    excludeUrl: "",
                    type: "ENGAGEMENT",
                    pUrl: "^.*$",
                    mca: false,
                  },
                },
                metrics: [],
                id: 509,
                triggers: [12100453],
                mt: [],
              },
              554: {
                version: 2,
                ep: 1747066983000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Clicks on product cards Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 608824,
                  },
                ],
                id: 554,
                triggers: [14074128],
                mt: {
                  1: "5712832",
                },
              },
              556: {
                version: 2,
                ep: 1747067017000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Clicks on Wishlist icon Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: "button.palette-product-card-favorite-button",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 608845,
                  },
                ],
                id: 556,
                triggers: [14074140],
                mt: {
                  1: "5806721",
                },
              },
              557: {
                version: 1,
                ep: 1747067101000,
                clickmap: 0,
                globalCode: [],
                type: "TRACK",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Clicks on product cards",
                manual: false,
                urlRegex: "^http.*\\:\\/\\/boozt\\.com.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "Website",
                },
                goals: {
                  43: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CLICK_ELEMENT",
                    pUrl: "^http.*\\:\\/\\/boozt\\.com.*$",
                    mca: false,
                    pExcludeUrl: "",
                  },
                },
                metrics: [
                  {
                    id: 43,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 557,
                triggers: [14074155],
                mt: {
                  43: "14074158",
                },
              },
              600: {
                version: 2,
                ep: 1750683683000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Click activate MDV button Shopcart Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: ["activate-deals-button"],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1563584,
                  },
                ],
                cEV: 1,
                id: 600,
                triggers: [15468257],
                mt: {
                  1: "15468260",
                },
              },
              601: {
                version: 2,
                ep: 1750685476000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Click deactivate MDV button Shopcart Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: [
                      "activate-deals-button.activate-deals-button--active",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1563617,
                  },
                ],
                cEV: 1,
                id: 601,
                triggers: [15468818],
                mt: {
                  1: "15468821",
                },
              },
              602: {
                version: 2,
                ep: 1750685644000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "DEactivate MDV clicks PDP page Report Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: [
                      "activate-deals-button.activate-deals-button--active",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1563623,
                  },
                ],
                cEV: 1,
                id: 602,
                triggers: [15468971],
                mt: {
                  1: "15468974",
                },
              },
              610: {
                version: 2,
                ep: 1750878285000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV confusion: PDP",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.view_item",
                    mca: true,
                  },
                  2: {
                    url: ["activate-deals-button--active"],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  3: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  4: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 1563575,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 4,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 5,
                    type: "g",
                    metricId: 0,
                  },
                ],
                cEV: 1,
                id: 610,
                triggers: [15556442],
                mt: {
                  1: "15556445",
                  2: "15467969",
                  3: "15556193",
                  4: "15556448",
                  5: "15556451",
                },
              },
              612: {
                version: 2,
                ep: 1750878460000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV confusion: Cart",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.view_item",
                    mca: true,
                  },
                  2: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  3: {
                    url: [
                      "activate-deals-button.activate-deals-button--active",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  4: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1563617,
                  },
                  {
                    id: 4,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 5,
                    type: "g",
                    metricId: 0,
                  },
                ],
                cEV: 1,
                id: 612,
                triggers: [15556517],
                mt: {
                  1: "15556520",
                  2: "15556193",
                  3: "15468821",
                  4: "15556523",
                  5: "15556526",
                },
              },
              633: {
                version: 2,
                ep: 1752668588000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV: purchase when MDV only 1 item",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "(_vwo_s().f_con(_vwo_s().U(),'boozt.com'))",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  2: {
                    url: ".shopcart-order-summary__action > button.palette-button",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  3: {
                    url: [
                      "palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-primary",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  4: {
                    url: "product-actions__add-to-cart,.palette-button.palette-button--primary-boozt-icon-only.palette-button--medium.palette-button--rectangle.palette-button--icon-position-right.palette-button--horizontal-align-center.palette-product-card-action-buttons__button,palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--icon-position-left.palette-button--horizontal-align-center.my-list-header__button-add-to-cart",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  6: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  7: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 874853,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1608019,
                  },
                  {
                    id: 4,
                    type: "m",
                    metricId: 1614336,
                  },
                  {
                    id: 5,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 6,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 7,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 633,
                triggers: [16296273],
                mt: {
                  1: "15556193",
                  2: "8025351",
                  3: "16296276",
                  4: "16222026",
                  5: "15556193",
                  6: "16958562",
                  7: "16958565",
                },
              },
              638: {
                version: 2,
                ep: 1753283073000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Add to Cart overall Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: ".v_addToCartCTA, .add-to-bag",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1085637,
                  },
                ],
                cEV: 1,
                id: 638,
                triggers: [16531509],
                mt: {
                  1: "9896635",
                },
              },
              2: {
                version: 2,
                ep: 1701343779000,
                clickmap: 0,
                globalCode: [],
                type: "ANALYZE_RECORDING",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Recording",
                manual: false,
                main: true,
                aK: 1,
                bl: "",
                wl: "",
                urlRegex: "^.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    urlRegex: "^.*$",
                    excludeUrl: "",
                    type: "ENGAGEMENT",
                    pUrl: "^.*$",
                    mca: false,
                  },
                },
                metrics: [],
                id: 2,
                triggers: [4362390],
                mt: [],
              },
              1: {
                version: 2,
                ep: 1701343462000,
                clickmap: 0,
                globalCode: [],
                type: "ANALYZE_HEATMAP",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Heatmap",
                manual: false,
                main: true,
                urlRegex: "^.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    variation_names: {
                      1: "website",
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    urlRegex: "^.*$",
                    excludeUrl: "",
                    type: "ENGAGEMENT",
                    pUrl: "^.*$",
                    mca: false,
                  },
                },
                metrics: [],
                id: 1,
                triggers: [4362387],
                mt: [],
              },
              508: {
                version: 2,
                ep: 1741601245000,
                clickmap: 0,
                globalCode: [],
                type: "ANALYZE_HEATMAP",
                status: "RUNNING",
                pc_traffic: 100,
                name: "all PDPs - Boozt - WIHA",
                manual: false,
                main: false,
                urlRegex: "^https\\:\\/\\/boozt\\.com\\/.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code:
                  "(_vwo_t.cm('eO', 'poll','_vwo_s().dv(\\'f_in\\',\\'page_type\\',\\'product\\')'))",
                ss: {
                  pu: "_vwo_u.cm('eO','js','1')",
                  csa: 0,
                  js: {
                    1: "// Example Code: This code will stop polling after 5 sec of dom ready (on calling executeTrigger() method)\nfunction() {\n    vwo_$(document).ready(function () {\n        // Waiting for 5 more seconds\n        setTimeout(function () {\n            // Call this method to stop the polling\n            executeTrigger();\n        }, 5000);\n    });\n}\n",
                  },
                },
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    variation_names: {
                      1: "website",
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    urlRegex: "^.*$",
                    excludeUrl: "",
                    type: "ENGAGEMENT",
                    pUrl: "^.*$",
                    mca: false,
                  },
                },
                metrics: [],
                id: 508,
                triggers: [12099919],
                mt: [],
              },
              653: {
                version: 2,
                ep: 1755264255000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Funnel: cart to purchase",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "(_vwo_s().f_con(_vwo_s().U(),'boozt.com'))",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  2: {
                    url: ".shopcart-order-summary__action > button.palette-button",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  3: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  4: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 874853,
                  },
                  {
                    id: 3,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 4,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 653,
                triggers: [17330391],
                mt: {
                  1: "15556193",
                  2: "8025351",
                  3: "17330394",
                  4: "17330397",
                },
              },
              646: {
                version: 3,
                ep: 1754660197000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV: purchase when MDV only 1 item(best)",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "(_vwo_s().f_con(_vwo_s().U(),'boozt.com'))",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  2: {
                    url: ".shopcart-order-summary__action > button.palette-button",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  3: {
                    url: [
                      "palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-primary",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  4: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.add_to_cart",
                    mca: true,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  6: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 874853,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1608019,
                  },
                  {
                    id: 4,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 5,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 6,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 646,
                triggers: [17113038],
                mt: {
                  1: "15556193",
                  2: "8025351",
                  3: "16296276",
                  4: "17113041",
                  5: "17113044",
                  6: "17113047",
                },
              },
              641: {
                version: 2,
                ep: 1753345973000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV: purchase when MDV only 1 item (v2)",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "(_vwo_s().f_con(_vwo_s().U(),'boozt.com'))",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  2: {
                    url: ".shopcart-order-summary__action > button.palette-button",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  3: {
                    url: [
                      "palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-primary",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  4: {
                    url: ".v_addToCartCTA, .add-to-bag",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  6: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 874853,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1608019,
                  },
                  {
                    id: 4,
                    type: "m",
                    metricId: 1085637,
                  },
                  {
                    id: 5,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 6,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 641,
                triggers: [16563687],
                mt: {
                  1: "15556193",
                  2: "8025351",
                  3: "16296276",
                  4: "9896635",
                  5: "16958550",
                  6: "16958553",
                },
              },
              637: {
                version: 2,
                ep: 1753174873000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_FUNNEL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV under threshold: purchase with MDV disabled",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "(_vwo_s().f_con(_vwo_s().U(),'boozt.com'))",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: true,
                  },
                  2: {
                    url: ".shopcart-order-summary__action > button.palette-button",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  3: {
                    url: [
                      "palette-modal-box-body.shopcart-discount-threshold-modal__content",
                      "palette-button.palette-button--secondary.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-secondary",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: true,
                  },
                  4: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.begin_checkout",
                    mca: true,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "gtm.purchase",
                    mca: true,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1571903,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 874853,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1563629,
                  },
                  {
                    id: 4,
                    type: "g",
                    metricId: 0,
                  },
                  {
                    id: 5,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 637,
                triggers: [16465380],
                mt: {
                  1: "15556193",
                  2: "8025351",
                  3: "15469034",
                  4: "16958556",
                  5: "16958559",
                },
              },
              635: {
                version: 2,
                ep: 1753174545000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV under threshold - to checkout Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: [
                      "palette-button.palette-button--secondary.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-secondary",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1634463,
                  },
                ],
                cEV: 1,
                id: 635,
                triggers: [16465167],
                mt: {
                  1: "16465170",
                },
              },
              627: {
                version: 2,
                ep: 1752563886000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Add to cart (including my products) Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: "product-actions__add-to-cart,.palette-button.palette-button--primary-boozt-icon-only.palette-button--medium.palette-button--rectangle.palette-button--icon-position-right.palette-button--horizontal-align-center.palette-product-card-action-buttons__button,palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--icon-position-left.palette-button--horizontal-align-center.my-list-header__button-add-to-cart",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1614336,
                  },
                ],
                cEV: 1,
                id: 627,
                triggers: [16222023],
                mt: {
                  1: "16222026",
                },
              },
              603: {
                version: 2,
                ep: 1750686206000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "MDV on - below threshold - to Checkout Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: [
                      "palette-modal-box-body.shopcart-discount-threshold-modal__content",
                      "palette-button.palette-button--secondary.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-secondary",
                    ],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1563629,
                  },
                ],
                cEV: 1,
                id: 603,
                triggers: [15469031],
                mt: {
                  1: "15469034",
                },
              },
              598: {
                version: 2,
                ep: 1750682642000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Activate MDV clicks PDP page Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: ["activate-deals-button"],
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1563563,
                  },
                ],
                cEV: 1,
                id: 598,
                triggers: [15467651],
                mt: {
                  1: "15467654",
                },
              },
              569: {
                version: 2,
                ep: 1747718324000,
                clickmap: 0,
                globalCode: [],
                type: "INSIGHTS_METRIC",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Clicks on product cards - Blouse & Shirt Report",
                manual: false,
                urlRegex: ".*",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: [],
                comb_n: [],
                goals: {
                  1: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                },
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 1477564,
                  },
                ],
                cEV: 1,
                id: 569,
                triggers: [14392858],
                mt: {
                  1: "14392860",
                },
              },
              223: {
                version: 2,
                ep: 1713950042000,
                clickmap: 0,
                globalCode: [],
                type: "ANALYZE_HEATMAP",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Nama - page_type LISTING",
                manual: false,
                main: false,
                urlRegex: "^https\\:\\/\\/boozt\\.com\\/.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code:
                  "(_vwo_t.cm('eO', 'poll','_vwo_s().dv(\\'f_in\\',\\'page_type\\',\\'Listing\\')'))",
                ss: {
                  pu: "_vwo_u.cm('eO','js','1')",
                  csa: 0,
                  js: {
                    1: "// Example Code: This code will stop polling after 5 sec of dom ready (on calling executeTrigger() method)\nfunction() {\n    // Assuming jQuery is defined on your website\n    vwo_$(document).ready(function () {\n        // Waiting for 5 more seconds\n        setTimeout(function () {\n            // Call this method to stop the polling\n            executeTrigger();\n        }, 5000);\n    });\n}\n",
                  },
                },
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: [],
                    },
                    globalWidgetSnippetIds: {
                      1: [],
                    },
                    variation_names: {
                      1: "website",
                    },
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "website",
                },
                goals: {
                  1: {
                    urlRegex: "^.*$",
                    excludeUrl: "",
                    type: "ENGAGEMENT",
                    pUrl: "^.*$",
                    mca: false,
                  },
                },
                metrics: [],
                id: 223,
                triggers: [5208805],
                mt: [],
              },
              331: {
                version: 1,
                ep: 1721487676000,
                clickmap: 0,
                globalCode: [],
                type: "TRACK",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Thank you page/Boozt",
                manual: false,
                urlRegex: "^https\\:\\/\\/boozt\\.com.*$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: [],
                    triggers: [],
                  },
                },
                combs: {
                  1: 1,
                },
                comb_n: {
                  1: "Website",
                },
                goals: {
                  16: {
                    urlRegex:
                      "^https\\:\\/\\/boozt\\.com\\/.*\\/.*\\/checkout\\/thankyou\\/?(?:[\\?#].*)?$",
                    excludeUrl: "",
                    type: "SEPARATE_PAGE",
                    mca: false,
                    pExcludeUrl: "",
                    pUrl: "",
                  },
                },
                metrics: [
                  {
                    id: 16,
                    type: "g",
                    metricId: 0,
                  },
                ],
                id: 331,
                funnel: [
                  {
                    version: 1,
                    ep: 1739370042000,
                    clickmap: 0,
                    globalCode: [],
                    type: "FUNNEL",
                    status: "RUNNING",
                    pc_traffic: 100,
                    name: "Entry page - zape - test",
                    manual: false,
                    urlRegex: ".*",
                    exclude_url: "",
                    multiple_domains: 0,
                    segment_code: "true",
                    ss: null,
                    ibe: 0,
                    sections: {
                      1: {
                        path: "",
                        variations: [],
                      },
                    },
                    isSpaRevertFeatureEnabled: true,
                    combs: {
                      1: 1,
                    },
                    comb_n: {
                      1: "Website",
                    },
                    goals: [
                      {
                        id: 40,
                        type: "SEPARATE_PAGE",
                      },
                      {
                        id: 19,
                        type: "SEPARATE_PAGE",
                      },
                      {
                        id: 16,
                        type: "SEPARATE_PAGE",
                      },
                    ],
                    id: 492,
                    v: 1,
                    triggers: ["4766709"],
                  },
                ],
                triggers: [6895366],
                mt: {
                  16: "11375434",
                },
              },
              642: {
                version: 4,
                ep: 1754395532000,
                clickmap: 1,
                globalCode: [],
                type: "SPLIT_URL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Booztlet - Model image test dresses\n\nWomen sorting dresses",
                manual: false,
                urlRegex:
                  "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\/klanningar\\/?(?:[\\?#].*)?$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: "https://www.booztlet.com/se/sv/kvinnor/klader/klanningar",
                      2: "https://www.booztlet.com/se/sv/kvinnor/klader-1/klanningar",
                    },
                    segment: {
                      1: 1,
                      2: 1,
                    },
                    variationsRegex: {
                      1: "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\/klanningar\\/?(?:[\\?#].*)?$",
                      2: "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\-1\\/klanningar\\/?(?:[\\?#].*)?$",
                    },
                    variation_names: {
                      1: "Control",
                      2: "Variation-1",
                    },
                    triggers: [],
                  },
                },
                varSegAllowed: false,
                combs: {
                  1: 0.5,
                  2: 0.5,
                },
                comb_n: {
                  1: "Control",
                  2: "Variation-1",
                },
                goals: {
                  1: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: false,
                  },
                  9: {
                    type: "REVENUE_TRACKING",
                    identifier: "gtm.purchase",
                    revenueProp: "value",
                    mca: false,
                  },
                  10: {
                    url: ".v_addToCartCTA, .add-to-bag",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  15: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_bounce",
                    mca: false,
                  },
                  17: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageUnload",
                    mca: false,
                  },
                  19: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  20: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageUnload",
                    mca: false,
                  },
                },
                pgre: true,
                ps: true,
                GTM: 1,
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 608824,
                  },
                  {
                    id: 5,
                    type: "m",
                    metricId: 794281,
                  },
                  {
                    id: 9,
                    type: "m",
                    metricId: 614131,
                  },
                  {
                    id: 10,
                    type: "m",
                    metricId: 1085637,
                  },
                  {
                    id: 15,
                    type: "m",
                    metricId: 522123,
                  },
                  {
                    id: 17,
                    type: "m",
                    metricId: 1280914,
                  },
                  {
                    id: 19,
                    type: "m",
                    metricId: 1586924,
                  },
                  {
                    id: 20,
                    type: "m",
                    metricId: 1586954,
                  },
                ],
                sV: 1,
                cEV: 1,
                id: 642,
                triggers: [17027544],
                mt: {
                  1: "5712832",
                  5: "6872059",
                  9: "5806724",
                  10: "9896635",
                  15: "4766709",
                  17: "15351062",
                  19: "15790172",
                  20: "15790175",
                },
              },
              656: {
                version: 4,
                ep: 1755675957000,
                clickmap: 1,
                globalCode: [],
                type: "SPLIT_URL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "JHEL – Men's Sorting Deepsort vs. Topsort",
                manual: false,
                urlRegex:
                  "^https\\:\\/\\/boozt\\.com\\/se\\/sv\\/klader\\-for\\-man\\/visa\\-allt\\/?(?:[\\?#].*)?$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code:
                  "((_vwo_s().f_e(_vwo_s().dt(),'desktop') || _vwo_s().f_e(_vwo_s().dt(),'mobile')))",
                ss: {
                  csa: 0,
                },
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: "https://www.boozt.com/se/sv/klader-for-man/visa-allt",
                      2: "https://www.boozt.com/se/sv/klader-for-man/kampanj",
                    },
                    segment: {
                      1: 1,
                      2: 1,
                    },
                    variationsRegex: {
                      1: "^https\\:\\/\\/boozt\\.com\\/se\\/sv\\/klader\\-for\\-man\\/visa\\-allt\\/?(?:[\\?#].*)?$",
                      2: "^https\\:\\/\\/boozt\\.com\\/se\\/sv\\/klader\\-for\\-man\\/kampanj\\/?(?:[\\?#].*)?$",
                    },
                    variation_names: {
                      1: "Control",
                      2: "Variation-1",
                    },
                    triggers: [],
                  },
                },
                varSegAllowed: false,
                combs: {
                  1: 0.5,
                  2: 0.5,
                },
                comb_n: {
                  1: "Control",
                  2: "Variation-1",
                },
                goals: {
                  1: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  2: {
                    url: ".v_addToCartCTA, .add-to-bag",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  3: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageUnload",
                    mca: false,
                  },
                  4: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: false,
                  },
                },
                pgre: true,
                ps: true,
                GTM: 1,
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 608824,
                  },
                  {
                    id: 2,
                    type: "m",
                    metricId: 1085637,
                  },
                  {
                    id: 3,
                    type: "m",
                    metricId: 1458879,
                  },
                  {
                    id: 4,
                    type: "m",
                    metricId: 794281,
                  },
                ],
                sV: 1,
                cEV: 1,
                id: 656,
                triggers: [17469024],
                mt: {
                  1: "5712832",
                  2: "9896635",
                  3: "14056104",
                  4: "6872059",
                },
              },
              649: {
                version: 4,
                ep: 1755091931000,
                clickmap: 1,
                globalCode: [],
                type: "SPLIT_URL",
                status: "RUNNING",
                pc_traffic: 100,
                name: "Booztlet - Model image test Trousers\n\nWomen sorting Trousers",
                manual: false,
                urlRegex:
                  "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\/byxor\\/?(?:[\\?#].*)?$",
                exclude_url: "",
                multiple_domains: 0,
                segment_code: "true",
                ss: null,
                ibe: 0,
                sections: {
                  1: {
                    path: "",
                    variations: {
                      1: "https://www.booztlet.com/se/sv/kvinnor/klader/byxor",
                      2: "https://www.booztlet.com/se/sv/kvinnor/klader-1/byxor",
                    },
                    segment: {
                      1: 1,
                      2: 1,
                    },
                    variationsRegex: {
                      1: "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\/byxor\\/?(?:[\\?#].*)?$",
                      2: "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\-1\\/byxor\\/?(?:[\\?#].*)?$",
                    },
                    variation_names: {
                      1: "Control",
                      2: "Variation-1",
                    },
                    triggers: [],
                  },
                },
                varSegAllowed: false,
                combs: {
                  1: 0.5,
                  2: 0.5,
                },
                comb_n: {
                  1: "Control",
                  2: "Variation-1",
                },
                goals: {
                  1: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  5: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageView",
                    mca: false,
                  },
                  9: {
                    type: "REVENUE_TRACKING",
                    identifier: "gtm.purchase",
                    revenueProp: "value",
                    mca: false,
                  },
                  10: {
                    url: ".v_addToCartCTA, .add-to-bag",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  15: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_bounce",
                    mca: false,
                  },
                  17: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageUnload",
                    mca: false,
                  },
                  21: {
                    url: ".product-list-wrap .product-listing__card",
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_dom_click",
                    mca: false,
                  },
                  22: {
                    type: "CUSTOM_GOAL",
                    identifier: "vwo_pageUnload",
                    mca: false,
                  },
                },
                pgre: true,
                ps: true,
                GTM: 1,
                metrics: [
                  {
                    id: 1,
                    type: "m",
                    metricId: 608824,
                  },
                  {
                    id: 5,
                    type: "m",
                    metricId: 794281,
                  },
                  {
                    id: 9,
                    type: "m",
                    metricId: 614131,
                  },
                  {
                    id: 10,
                    type: "m",
                    metricId: 1085637,
                  },
                  {
                    id: 15,
                    type: "m",
                    metricId: 522123,
                  },
                  {
                    id: 17,
                    type: "m",
                    metricId: 1280914,
                  },
                  {
                    id: 21,
                    type: "m",
                    metricId: 1700730,
                  },
                  {
                    id: 22,
                    type: "m",
                    metricId: 1700778,
                  },
                ],
                sV: 1,
                cEV: 1,
                id: 649,
                triggers: [17264022],
                mt: {
                  1: "5712832",
                  5: "6872059",
                  9: "5806724",
                  10: "9896635",
                  15: "4766709",
                  17: "15351062",
                  21: "17264025",
                  22: "17264028",
                },
              },
            },
            changeSets: {},
            plugins: {
              IP: "105.112.206.180",
              DACDNCONFIG: {
                DONT_IOS: false,
                CJ: false,
                RDBG: false,
                DNDOFST: 1000,
                jsConfig: {
                  se: 1,
                  recData360Enabled: 1,
                  m360: 1,
                  ast: 0,
                  iche: 1,
                  earc: 1,
                  ge: 1,
                  ele: 1,
                },
                SCC: '{"cache":0,"sT":2000,"hE":"body"}',
                debugEvt: false,
                UCP: false,
                SD: false,
                SPA: true,
                BSECJ: false,
                IAF: false,
                AST: false,
                DT: {
                  DEVICE: "mobile",
                  TC: "function(){ return _vwo_t.cm('eO','js',VWO._.dtc.ctId); };",
                  SEGMENTCODE:
                    "function(){ return _vwo_s().f_e(_vwo_s().dt(),'mobile') };",
                  DELAYAFTERTRIGGER: 1000,
                },
                FB: false,
                CKLV: false,
                SPAR: false,
                CINSTJS: false,
                SST: false,
                CRECJS: false,
                eNC: false,
                PRTHD: false,
                CSHS: false,
              },
              GEO: {
                c: "Lagos",
                vn: "geoip2",
                cEU: "",
                rn: "Lagos",
                conC: "AF",
                cc: "NG",
                cn: "Nigeria",
                r: "LA",
              },
              UA: {
                os: "Windows",
                dt: "desktop",
                br: "Firefox",
                de: "Other",
                ps: "desktop:false:Windows:10:Firefox:142.0.:Other",
              },
              LIBINFO: {
                SURVEY_DEBUG_EVENTS: {
                  HASH: "c0ccff8d21382a59d9070b22ac4297b8br",
                },
                TRACK: {
                  HASH: "2d188925215fb57944489ba1bd6bd0a8br",
                  LIB_SUFFIX: "",
                },
                OPA: {
                  PATH: "/4.0",
                  HASH: "60289df2c99e4d13de6e5be0ca504161br",
                },
                HEATMAP_HELPER: {
                  HASH: "614d859139577a5f50b5240f8a5c5c47br",
                },
                DEBUGGER_UI: {
                  HASH: "35091fed35f3709e5d1f9152e24de051br",
                },
                EVAD: {
                  HASH: "",
                  LIB_SUFFIX: "",
                },
                SURVEY: {
                  HASH: "df0b84dfff4645fb6d1fda3cd3a1ab85br",
                },
                WORKER: {
                  HASH: "70faafffa0475802f5ee03ca5ff74179br",
                },
                SURVEY_HTML: {
                  HASH: "03888dfbff0588a0a517c45d94ce4093br",
                },
              },
              PIICONFIG: false,
            },
            vwoData: {
              gC: null,
            },
            crossDomain: {},
            integrations: {
              508: {
                GTM: 1,
              },
              618: {
                GTM: 1,
              },
              223: {
                GTM: 1,
              },
              642: {
                GTM: 1,
              },
              650: {
                GTM: 1,
              },
              580: {
                GTM: 1,
              },
              509: {
                GTM: 1,
              },
              447: {
                GTM: 1,
              },
              649: {
                GTM: 1,
              },
              656: {
                GTM: 1,
              },
            },
            events: {
              vwo_survey_surveyCompleted: {},
              vwo_survey_submit: {},
              vwo_survey_reachedThankyou: {},
              vwo_survey_questionShown: {},
              "gtm.view_item": {},
              "gtm.add_to_cart": {},
              vwo_survey_complete: {},
              vwo_survey_close: {},
              vwo_customConversion: {},
              vwo_revenue: {},
              vwo_leaveIntent: {},
              vwo_conversion: {},
              vwo_timer: {
                nS: ["timeSpent"],
              },
              vwo_surveyQuestionSubmitted: {},
              vwo_performance: {},
              vwo_log: {},
              vwo_repeatedHovered: {},
              vwo_repeatedScrolled: {},
              vwo_selection: {},
              vwo_analyzeHeatmap: {},
              vwo_pageRefreshed: {},
              vwo_cursorThrashed: {},
              purchaseOfSuperDealProducts: {},
              vwo_errorOnPage: {},
              clickAddToCartFavorites: {},
              vwo_customTrigger: {},
              vwo_pageView: {},
              "gtm.purchase": {},
              vwo_fmeSdkInit: {},
              "gtm.begin_checkout": {},
              vwo_survey_questionAttempted: {},
              vwo_pageUnload: {},
              vwo_survey_display: {},
              vwo_orientationChanged: {},
              vwo_analyzeRecording: {},
              vwo_variationShown: {},
              tabOut: {},
              vwo_debugLogs: {},
              vwo_networkChanged: {},
              vwo_dom_click: {
                nS: ["target", "target.innerText"],
              },
              vwo_zoom: {},
              vwo_trackGoalVisited: {},
              vwo_newSessionCreated: {},
              vwo_syncVisitorProp: {},
              vwo_surveyQuestionAttempted: {},
              vwo_dom_submit: {},
              addToCartOnSuperDealProducts: {},
              vwo_appCrashed: {},
              revenueTest: {},
              copiedProductTitleExitIntent: {},
              vwo_analyzeForm: {},
              "revenue-tracking": {},
              clickAddToCart: {},
              "gtm.eec.add": {},
              "gtm.order": {},
              "clicksOnDma-ClanTest": {},
              exitRateMultiplePdPs: {},
              bounceRate1ItemPdp: {},
              addToCartFromThisPlpThankYou: {},
              vwo_survey_attempt: {},
              vwo_sessionSync: {},
              purchase: {},
              vwo_screenViewed: {},
              vwo_dom_scroll: {
                nS: ["pxTop", "pxBottom", "bottom", "top"],
              },
              conversionRatePopToPdpToPurchase: {},
              vwo_tabOut: {},
              vwo_tabIn: {},
              vwo_mouseout: {},
              vwo_copy: {},
              vwo_quickBack: {},
              vwo_recommendation_block_shown: {},
              vwo_surveyAttempted: {},
              vwo_surveyExtraData: {},
              vwo_surveyCompleted: {},
              vwo_surveyQuestionDisplayed: {},
              copiedTextExitIntent: {},
              vwo_surveyDisplayed: {},
              vwo_surveyClosed: {},
              vwo_goalVisit: {
                nS: ["expId"],
              },
              vwo_appTerminated: {},
              vwo_appComesInForeground: {},
              vwo_appGoesInBackground: {},
              vwo_appLaunched: {},
              vwo_autoCapture: {},
              vwo_longPress: {},
              vwo_fling: {},
              vwo_scroll: {},
              vwo_doubleTap: {},
              vwo_singleTap: {},
              vwo_appNotResponding: {},
              vwo_page_session_count: {},
              vwo_rC: {},
              vwo_vA: {},
            },
            visitorProps: {},
            uuid: "DD436B67FAA7F2E6C9536D47F36598CA1",
            syV: {},
            syE: {},
            cSE: {},
            CIF: false,
            syncEvent: "sessionCreated",
            syncAttr: "sessionCreated",
          },
          sCIds: {},
          oCids: {},
          triggers: {
            15467654: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    ["event.target", "sel", ".activate-deals-button"],
                    ["page.url", "pgc", "2463416"],
                  ],
                },
              ],
              dslv: 2,
            },
            15468818: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "601"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16296273: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "633"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["url", "cn", "boozt.com"]],
                },
              ],
              dslv: 2,
            },
            2: {
              cnds: [
                {
                  event: "vwo_variationShown",
                  id: 100,
                },
              ],
            },
            16563687: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "641"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["url", "cn", "boozt.com"]],
                },
              ],
              dslv: 2,
            },
            5: {
              cnds: [
                {
                  event: "vwo_postInit",
                  id: 101,
                },
              ],
            },
            8: {
              cnds: [
                {
                  event: "vwo_pageView",
                  id: 102,
                },
              ],
            },
            9: {
              cnds: [
                {
                  event: "vwo_groupCampTriggered",
                  id: 105,
                },
              ],
            },
            15468821: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".activate-deals-button.activate-deals-button--active",
                    ],
                    ["page.url", "pgc", "2463518"],
                  ],
                },
              ],
              dslv: 2,
            },
            75: {
              cnds: [
                {
                  event: "vwo_urlChange",
                  id: 99,
                },
              ],
            },
            16531509: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "638"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            12099919: {
              cnds: [
                "o",
                {
                  id: 500,
                  event: "vwo_pageView",
                  filters: [["storage.cookies._vis_opt_exp_508_combi", "nbl"]],
                },
                [
                  "a",
                  {
                    event: "vwo__activated",
                    id: 3,
                    filters: [["event.id", "eq", "508"]],
                  },
                  {
                    event: "vwo_notRedirecting",
                    id: 4,
                    filters: [],
                  },
                  {
                    event: "vwo_visibilityTriggered",
                    id: 5,
                    filters: [],
                  },
                  [
                    "o",
                    {
                      id: 1000,
                      event: "vwo_timer",
                      filters: [
                        [
                          "tags.js_024334b3716acc104d6c4c87514ced03",
                          "eq",
                          "true",
                        ],
                      ],
                      exitTrigger: "12099916",
                    },
                    {
                      id: 1001,
                      event: "vwo_pageView",
                      filters: [
                        [
                          "tags.js_024334b3716acc104d6c4c87514ced03",
                          "eq",
                          "true",
                        ],
                      ],
                    },
                  ],
                ],
              ],
              dslv: 2,
            },
            15468971: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "602"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            9896635: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    ["event.target", "sel", ".v_addToCartCTA, .add-to-bag"],
                  ],
                },
              ],
              dslv: 2,
            },
            16958550: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16958553: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15468974: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".activate-deals-button.activate-deals-button--active",
                    ],
                    ["page.url", "pgc", "2463629"],
                  ],
                },
              ],
              dslv: 2,
            },
            14392858: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "569"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            4766709: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            6895366: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "331"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            17264022: {
              cnds: [
                "o",
                [
                  "a",
                  {
                    id: 500,
                    event: "vwo_pageView",
                    filters: [
                      ["storage.cookies._vis_opt_exp_649_split", "nbl"],
                    ],
                  },
                  {
                    id: 504,
                    event: "vwo_pageView",
                    filters: [
                      [
                        "page.url",
                        "urlReg",
                        "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\-1\\/byxor\\/?(?:[\\?#].*)?$",
                      ],
                    ],
                  },
                ],
                [
                  "a",
                  {
                    event: "vwo_visibilityTriggered",
                    id: 5,
                    filters: [],
                  },
                  {
                    id: 1000,
                    event: "vwo_pageView",
                    filters: [],
                  },
                ],
              ],
              dslv: 2,
            },
            14392860: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".product-list-wrap .product-listing__card",
                    ],
                    ["page.url", "pgc", "2339518"],
                  ],
                },
              ],
              dslv: 2,
            },
            16465380: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "637"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["url", "cn", "boozt.com"]],
                },
              ],
              dslv: 2,
            },
            17330391: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "653"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["url", "cn", "boozt.com"]],
                },
              ],
              dslv: 2,
            },
            11375434: {
              cnds: [
                "o",
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [
                    [
                      "page.url",
                      "urlReg",
                      "^https\\:\\/\\/boozt\\.com\\/.*\\/.*\\/checkout\\/thankyou\\/?(?:[\\?#].*)?$",
                    ],
                  ],
                },
                {
                  id: 1001,
                  event: "vwo_goalVisit",
                  filters: [
                    [
                      "page.url",
                      "urlReg",
                      "^https\\:\\/\\/boozt\\.com\\/.*\\/.*\\/checkout\\/thankyou\\/?(?:[\\?#].*)?$",
                    ],
                    ["event.expId", "eq", 331],
                  ],
                },
              ],
              dslv: 2,
            },
            15556442: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "610"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15556517: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "612"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            17330394: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15469034: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    "a",
                    [
                      "event.target",
                      "sel",
                      ".palette-modal-box-body.shopcart-discount-threshold-modal__content,.palette-button.palette-button--secondary.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-secondary",
                    ],
                    ["page.url", "pgc", "2463518"],
                  ],
                },
              ],
              dslv: 2,
            },
            8971140: {
              cnds: [
                "a",
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
                {
                  id: 1002,
                  event: "vwo_pageView",
                  filters: [["page.url", "pgc", "1573236"]],
                },
              ],
              dslv: 2,
            },
            15556445: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.view_item",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            14074155: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "557"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16958556: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            17264025: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    "a",
                    [
                      "event.target",
                      "sel",
                      ".product-list-wrap .product-listing__card",
                    ],
                    ["page.url", "pgc", "2661951"],
                  ],
                },
              ],
              dslv: 2,
            },
            15467969: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    ["event.target", "sel", ".activate-deals-button--active"],
                    ["page.url", "pgc", "2463416"],
                  ],
                },
              ],
              dslv: 2,
            },
            17264028: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageUnload",
                  filters: [
                    "a",
                    ["event.sdyp", "gte", 50],
                    ["page.url", "pgc", "2661951"],
                  ],
                },
              ],
              dslv: 2,
            },
            16958559: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15556520: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.view_item",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            17027544: {
              cnds: [
                "o",
                [
                  "a",
                  {
                    id: 500,
                    event: "vwo_pageView",
                    filters: [
                      ["storage.cookies._vis_opt_exp_642_split", "nbl"],
                    ],
                  },
                  {
                    id: 504,
                    event: "vwo_pageView",
                    filters: [
                      [
                        "page.url",
                        "urlReg",
                        "^https\\:\\/\\/booztlet\\.com\\/se\\/sv\\/kvinnor\\/klader\\-1\\/klanningar\\/?(?:[\\?#].*)?$",
                      ],
                    ],
                  },
                ],
                [
                  "a",
                  {
                    event: "vwo_visibilityTriggered",
                    id: 5,
                    filters: [],
                  },
                  {
                    id: 1000,
                    event: "vwo_pageView",
                    filters: [],
                  },
                ],
              ],
              dslv: 2,
            },
            14056104: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageUnload",
                  filters: [
                    "a",
                    ["event.sdyp", "gte", 50],
                    ["page.url", "pgc", "2681118"],
                  ],
                },
              ],
              dslv: 2,
            },
            17469024: {
              cnds: [
                "o",
                {
                  id: 500,
                  event: "vwo_pageView",
                  filters: [
                    "o",
                    ["storage.cookies._vis_opt_exp_656_combi", "nbl"],
                    ["storage.cookies._vis_opt_exp_656_split", "nbl"],
                  ],
                },
                [
                  "a",
                  {
                    event: "vwo_visibilityTriggered",
                    id: 5,
                    filters: [],
                  },
                  {
                    id: 1000,
                    event: "vwo_pageView",
                    filters: [["deviceType", "in", ["desktop", "mobile"]]],
                  },
                ],
              ],
              dslv: 2,
            },
            15790175: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageUnload",
                  filters: [
                    "a",
                    ["event.sdyp", "gte", 50],
                    ["page.url", "pgc", "2636328"],
                  ],
                },
              ],
              dslv: 2,
            },
            15556448: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15790172: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    "a",
                    [
                      "event.target",
                      "sel",
                      ".product-list-wrap .product-listing__card",
                    ],
                    ["page.url", "pgc", "2636328"],
                  ],
                },
              ],
              dslv: 2,
            },
            15351062: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageUnload",
                  filters: [["page.url", "pgc", "2636325"]],
                },
              ],
              dslv: 2,
            },
            4362390: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "2"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15556451: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            6872059: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["page.url", "pgc", "2076699"]],
                },
              ],
              dslv: 2,
            },
            17113038: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "646"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["url", "cn", "boozt.com"]],
                },
              ],
              dslv: 2,
            },
            5208805: {
              cnds: [
                "o",
                {
                  id: 500,
                  event: "vwo_pageView",
                  filters: [["storage.cookies._vis_opt_exp_223_combi", "nbl"]],
                },
                [
                  "a",
                  {
                    event: "vwo__activated",
                    id: 3,
                    filters: [["event.id", "eq", "223"]],
                  },
                  {
                    event: "vwo_notRedirecting",
                    id: 4,
                    filters: [],
                  },
                  {
                    event: "vwo_visibilityTriggered",
                    id: 5,
                    filters: [],
                  },
                  [
                    "o",
                    {
                      id: 1000,
                      event: "vwo_timer",
                      filters: [
                        [
                          "tags.js_d3b7265922f82b5d431a30498a883c80",
                          "eq",
                          "true",
                        ],
                      ],
                      exitTrigger: "5208802",
                    },
                    {
                      id: 1001,
                      event: "vwo_pageView",
                      filters: [
                        [
                          "tags.js_d3b7265922f82b5d431a30498a883c80",
                          "eq",
                          "true",
                        ],
                      ],
                    },
                  ],
                ],
              ],
              dslv: 2,
            },
            5208802: {
              cnds: [
                {
                  id: 0,
                  event: "vwo_postInit",
                  filters: [[["tags.ce223_4_1"], "exec"]],
                },
              ],
            },
            15469031: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "603"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15556523: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15556193: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [["page.url", "pgc", "2463518"]],
                },
              ],
              dslv: 2,
            },
            14074128: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "554"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16465167: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "635"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15556526: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            14074158: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".product-list-wrap .product-listing__card",
                    ],
                  ],
                },
              ],
              dslv: 2,
            },
            17330397: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            12099916: {
              cnds: [
                {
                  id: 0,
                  event: "vwo_postInit",
                  filters: [[["tags.ce508_4_1"], "exec"]],
                },
              ],
            },
            16465170: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".palette-button.palette-button--secondary.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-secondary",
                    ],
                  ],
                },
              ],
              dslv: 2,
            },
            16296276: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    "a",
                    [
                      "event.target",
                      "sel",
                      ".palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--expanded.palette-button--horizontal-align-center.shopcart-discount-threshold-modal__action-primary",
                    ],
                    ["page.url", "pgc", "2463518"],
                  ],
                },
              ],
              dslv: 2,
            },
            5806721: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      "button.palette-product-card-favorite-button",
                    ],
                  ],
                },
              ],
              dslv: 2,
            },
            8025351: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".shopcart-order-summary__action > button.palette-button",
                    ],
                  ],
                },
              ],
              dslv: 2,
            },
            4362387: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "1"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            12100453: {
              cnds: [
                "o",
                {
                  id: 500,
                  event: "vwo_pageView",
                  filters: [["storage.cookies._vis_opt_exp_509_combi", "nbl"]],
                },
                [
                  "a",
                  {
                    event: "vwo__activated",
                    id: 3,
                    filters: [["event.id", "eq", "509"]],
                  },
                  {
                    event: "vwo_notRedirecting",
                    id: 4,
                    filters: [],
                  },
                  {
                    event: "vwo_visibilityTriggered",
                    id: 5,
                    filters: [],
                  },
                  [
                    "o",
                    {
                      id: 1000,
                      event: "vwo_timer",
                      filters: [
                        [
                          "tags.js_024334b3716acc104d6c4c87514ced03",
                          "eq",
                          "true",
                        ],
                      ],
                      exitTrigger: "12100450",
                    },
                    {
                      id: 1001,
                      event: "vwo_pageView",
                      filters: [
                        [
                          "tags.js_024334b3716acc104d6c4c87514ced03",
                          "eq",
                          "true",
                        ],
                      ],
                    },
                  ],
                ],
              ],
              dslv: 2,
            },
            12100450: {
              cnds: [
                {
                  id: 0,
                  event: "vwo_postInit",
                  filters: [[["tags.ce509_4_1"], "exec"]],
                },
              ],
            },
            15468257: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "600"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            17113041: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.add_to_cart",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            5806724: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15467651: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "598"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16222026: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    "a",
                    [
                      "event.target",
                      "sel",
                      "product-actions__add-to-cart,.palette-button.palette-button--primary-boozt-icon-only.palette-button--medium.palette-button--rectangle.palette-button--icon-position-right.palette-button--horizontal-align-center.palette-product-card-action-buttons__button,palette-button.palette-button--primary-boozt.palette-button--medium.palette-button--rectangle.palette-button--icon-position-left.palette-button--horizontal-align-center.my-list-header__button-add-to-cart",
                    ],
                    ["page.url", "pgc", "2547213"],
                  ],
                },
              ],
              dslv: 2,
            },
            17113044: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            5712832: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    [
                      "event.target",
                      "sel",
                      ".product-list-wrap .product-listing__card",
                    ],
                  ],
                },
              ],
              dslv: 2,
            },
            14074140: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "556"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16958562: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.begin_checkout",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            17113047: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            16222023: {
              cnds: [
                "a",
                {
                  event: "vwo__activated",
                  id: 3,
                  filters: [["event.id", "eq", "627"]],
                },
                {
                  event: "vwo_notRedirecting",
                  id: 4,
                  filters: [],
                },
                {
                  event: "vwo_visibilityTriggered",
                  id: 5,
                  filters: [],
                },
                {
                  id: 1000,
                  event: "vwo_pageView",
                  filters: [],
                },
              ],
              dslv: 2,
            },
            15468260: {
              cnds: [
                {
                  id: 1000,
                  event: "vwo_dom_click",
                  filters: [
                    ["event.target", "sel", ".activate-deals-button"],
                    ["page.url", "pgc", "2463518"],
                  ],
                },
              ],
              dslv: 2,
            },
            16958565: {
              cnds: [
                {
                  id: 1000,
                  event: "gtm.purchase",
                  filters: [],
                },
              ],
              dslv: 2,
            },
          },
          tags: {
            ce508_4_1: {
              fn: function (executeTrigger, vwo_$) {
                // Example Code: This code will stop polling after 5 sec of dom ready (on calling executeTrigger() method)
                (function () {
                  vwo_$(document).ready(function () {
                    // Waiting for 5 more seconds
                    setTimeout(function () {
                      // Call this method to stop the polling
                      executeTrigger();
                    }, 5000);
                  });
                })();
              },
            },
            ce223_4_1: {
              fn: function (executeTrigger, vwo_$) {
                // Example Code: This code will stop polling after 5 sec of dom ready (on calling executeTrigger() method)
                (function () {
                  // Assuming jQuery is defined on your website
                  vwo_$(document).ready(function () {
                    // Waiting for 5 more seconds
                    setTimeout(function () {
                      // Call this method to stop the polling
                      executeTrigger();
                    }, 5000);
                  });
                })();
              },
            },
            js_024334b3716acc104d6c4c87514ced03: {
              fn: function () {
                return window.VWO.modules.tags.dL("eq", "page_type", "product");
              },
            },
            js_d3b7265922f82b5d431a30498a883c80: {
              fn: function () {
                return window.VWO.modules.tags.dL("eq", "page_type", "Listing");
              },
            },
            ce509_4_1: {
              fn: function (executeTrigger, vwo_$) {
                // Example Code: This code will stop polling after 5 sec of dom ready (on calling executeTrigger() method)
                (function () {
                  vwo_$(document).ready(function () {
                    // Waiting for 5 more seconds
                    setTimeout(function () {
                      // Call this method to stop the polling
                      executeTrigger();
                    }, 5000);
                  });
                })();
              },
            },
          },
          rules: [
            {
              triggers: ["15467654"],
              tags: [
                {
                  metricId: 1563563,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 598,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15468818"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.601",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["16296273"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.633",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["16563687"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.641",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15468821"],
              tags: [
                {
                  metricId: 1563617,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 601,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 1563617,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 612,
                        g: 3,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16531509"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.638",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["12099919"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.508",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15468971"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.602",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["9896635"],
              tags: [
                {
                  metricId: 1085637,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 638,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 1085637,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 641,
                        g: 4,
                      },
                    ],
                  },
                },
                {
                  metricId: 1085637,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 10,
                      },
                    ],
                  },
                },
                {
                  metricId: 1085637,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 656,
                        g: 2,
                      },
                    ],
                  },
                },
                {
                  metricId: 1085637,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 10,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16958550"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 641,
                        g: 5,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16958553"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 641,
                        g: 6,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15468974"],
              tags: [
                {
                  metricId: 1563623,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 602,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["14392858"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.569",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["4766709"],
              tags: [
                {
                  metricId: 522123,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 15,
                      },
                    ],
                  },
                },
                {
                  metricId: 522123,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 15,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["6895366"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.331",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["17264022"],
              tags: [
                {
                  priority: 0,
                  data: "campaigns.649",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["14392860"],
              tags: [
                {
                  metricId: 1477564,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 569,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16465380"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.637",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["17330391"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.653",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["11375434"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 331,
                        g: 16,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15556442"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.610",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15556517"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.612",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["17330394"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 653,
                        g: 3,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15469034"],
              tags: [
                {
                  metricId: 1563629,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 637,
                        g: 3,
                      },
                    ],
                  },
                },
                {
                  metricId: 1563629,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 603,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15556445"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 610,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["14074155"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.557",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["16958556"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 637,
                        g: 4,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17264025"],
              tags: [
                {
                  metricId: 1700730,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 21,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15467969"],
              tags: [
                {
                  metricId: 1563575,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 610,
                        g: 2,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16958559"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 637,
                        g: 5,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15556520"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 612,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17027544"],
              tags: [
                {
                  priority: 0,
                  data: "campaigns.642",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["8971140"],
              tags: [
                {
                  data: {
                    priority: 1,
                    samplingRate: -2,
                  },
                  id: "sampleVisitor",
                },
              ],
            },
            {
              triggers: ["17264028"],
              tags: [
                {
                  metricId: 1700778,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 22,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15556448"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 610,
                        g: 4,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["14056104"],
              tags: [
                {
                  metricId: 1458879,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 656,
                        g: 3,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17469024"],
              tags: [
                {
                  priority: 0,
                  data: "campaigns.656",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15790175"],
              tags: [
                {
                  metricId: 1586954,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 20,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15556451"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 610,
                        g: 5,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15790172"],
              tags: [
                {
                  metricId: 1586924,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 19,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17113038"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.646",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["5208805"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.223",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15556193"],
              tags: [
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 610,
                        g: 3,
                      },
                    ],
                  },
                },
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 612,
                        g: 2,
                      },
                    ],
                  },
                },
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 633,
                        g: 1,
                      },
                      {
                        c: 633,
                        g: 5,
                      },
                    ],
                  },
                },
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 653,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 646,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 641,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 1571903,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 637,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15469031"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.603",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15556523"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 612,
                        g: 4,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["14074128"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.554",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["14074140"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.556",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["14074158"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 557,
                        g: 43,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15556526"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 612,
                        g: 5,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["5712832"],
              tags: [
                {
                  metricId: 608824,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 554,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 608824,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 608824,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 656,
                        g: 1,
                      },
                    ],
                  },
                },
                {
                  metricId: 608824,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17330397"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 653,
                        g: 4,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15467651"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.598",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["16465170"],
              tags: [
                {
                  metricId: 1634463,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 635,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16296276"],
              tags: [
                {
                  metricId: 1608019,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 633,
                        g: 3,
                      },
                    ],
                  },
                },
                {
                  metricId: 1608019,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 646,
                        g: 3,
                      },
                    ],
                  },
                },
                {
                  metricId: 1608019,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 641,
                        g: 3,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["5806721"],
              tags: [
                {
                  metricId: 608845,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 556,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["8025351"],
              tags: [
                {
                  metricId: 874853,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 633,
                        g: 2,
                      },
                    ],
                  },
                },
                {
                  metricId: 874853,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 653,
                        g: 2,
                      },
                    ],
                  },
                },
                {
                  metricId: 874853,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 646,
                        g: 2,
                      },
                    ],
                  },
                },
                {
                  metricId: 874853,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 641,
                        g: 2,
                      },
                    ],
                  },
                },
                {
                  metricId: 874853,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 637,
                        g: 2,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["4362387"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.1",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["12100453"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.509",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["17113041"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 646,
                        g: 4,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15468257"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.600",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["6872059"],
              tags: [
                {
                  metricId: 794281,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 5,
                      },
                    ],
                  },
                },
                {
                  metricId: 794281,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 656,
                        g: 4,
                      },
                    ],
                  },
                },
                {
                  metricId: 794281,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 5,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["5806724"],
              tags: [
                {
                  metricId: 614131,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 9,
                      },
                    ],
                  },
                },
                {
                  metricId: 614131,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 9,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["15351062"],
              tags: [
                {
                  metricId: 1280914,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 642,
                        g: 17,
                      },
                    ],
                  },
                },
                {
                  metricId: 1280914,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 649,
                        g: 17,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16222026"],
              tags: [
                {
                  metricId: 1614336,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 633,
                        g: 4,
                      },
                    ],
                  },
                },
                {
                  metricId: 1614336,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 627,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17113044"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 646,
                        g: 5,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16465167"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.635",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["4362390"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.2",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["16958562"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 633,
                        g: 6,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["17113047"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 646,
                        g: 6,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16222023"],
              tags: [
                {
                  priority: 4,
                  data: "campaigns.627",
                  id: "runCampaign",
                },
              ],
            },
            {
              triggers: ["15468260"],
              tags: [
                {
                  metricId: 1563584,
                  id: "metric",
                  data: {
                    type: "m",
                    campaigns: [
                      {
                        c: 600,
                        g: 1,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["16958565"],
              tags: [
                {
                  metricId: 0,
                  id: "metric",
                  data: {
                    type: "g",
                    campaigns: [
                      {
                        c: 633,
                        g: 7,
                      },
                    ],
                  },
                },
              ],
            },
            {
              triggers: ["8"],
              tags: [
                {
                  priority: 3,
                  id: "prePostMutation",
                },
                {
                  priority: 2,
                  id: "groupCampaigns",
                },
              ],
            },
            {
              triggers: ["9"],
              tags: [
                {
                  priority: 2,
                  id: "visibilityService",
                },
              ],
            },
            {
              triggers: ["2"],
              tags: [
                {
                  id: "runTestCampaign",
                },
              ],
            },
            {
              triggers: ["75"],
              tags: [
                {
                  id: "urlChange",
                },
              ],
            },
            {
              triggers: ["5"],
              tags: [
                {
                  id: "checkEnvironment",
                },
              ],
            },
          ],
          pages: {
            ec: [
              {
                2044003: {
                  inc: ["o", ["url", "urlReg", "(?i).*"]],
                },
              },
              {
                2547213: {
                  inc: ["o", ["url", "urlReg", "(?i).*boozt\\.com.*"]],
                },
              },
              {
                1573236: {
                  inc: ["o", ["url", "urlReg", "(?i)^.*$"]],
                },
              },
            ],
          },
          pagesEval: {
            ec: [2044003, 2547213, 1573236],
          },
          stags: {},
        };
      })();
      var commonWrapper = function (argument) {
        if (!argument) {
          argument = {
            valuesGetter: function () {
              return {};
            },
            valuesSetter: function () {},
            verifyData: function () {
              return {};
            },
          };
        }
        var getVisitorUuid = function () {
          if (window._vwo_acc_id >= 1037725) {
            return window.VWO && window.VWO.get("visitor.id");
          } else {
            return (
              window.VWO._ &&
              window.VWO._.cookies &&
              window.VWO._.cookies.get("_vwo_uuid")
            );
          }
        };
        var pollInterval = 100;
        var timeout = 60000;
        return function () {
          var accountIntegrationSettings = {};
          var _interval = null;
          function waitForAnalyticsVariables() {
            try {
              accountIntegrationSettings = argument.valuesGetter();
              accountIntegrationSettings.visitorUuid = getVisitorUuid();
            } catch (error) {
              accountIntegrationSettings = undefined;
            }
            if (
              accountIntegrationSettings &&
              argument.verifyData(accountIntegrationSettings)
            ) {
              argument.valuesSetter(accountIntegrationSettings);
              return 1;
            }
            return 0;
          }
          var currentTime = 0;
          _interval = setInterval(function () {
            currentTime = currentTime || performance.now();
            var result = waitForAnalyticsVariables();
            if (result || performance.now() - currentTime >= timeout) {
              clearInterval(_interval);
            }
          }, pollInterval);
        };
      };
      commonWrapper({
        valuesGetter: function () {
          return {
            ga4s: 0,
          };
        },
        valuesSetter: function (data) {
          var singleCall = data["ga4s"] || 0;
          if (singleCall) {
            window.sessionStorage.setItem("vwo-ga4-singlecall", true);
          }
          var ga4_device_id = "";
          if (typeof window.VWO._.cookies !== "undefined") {
            ga4_device_id = window.VWO._.cookies.get("_ga") || "";
          }
          if (ga4_device_id) {
            window.vwo_ga4_uuid = ga4_device_id.split(".").slice(-2).join(".");
          }
        },
        verifyData: function (data) {
          if (typeof window.VWO._.cookies !== "undefined") {
            return window.VWO._.cookies.get("_ga") || "";
          } else {
            return false;
          }
        },
      })();
      var pushBasedCommonWrapper = function (argument) {
        var firedCamp = {};
        if (!argument) {
          argument = {
            integrationName: "",
            getExperimentList: function () {},
            accountSettings: function () {},
            pushData: function () {},
          };
        }
        return function () {
          window.VWO = window.VWO || [];
          var getVisitorUuid = function () {
            if (window._vwo_acc_id >= 1037725) {
              return window.VWO && window.VWO.get("visitor.id");
            } else {
              return (
                window.VWO._ &&
                window.VWO._.cookies &&
                window.VWO._.cookies.get("_vwo_uuid")
              );
            }
          };
          var sendDebugLogsOld = function (
            expId,
            variationId,
            errorType,
            user_type,
            data
          ) {
            try {
              var errorPayload = {
                f: argument["integrationName"] || "",
                a: window._vwo_acc_id,
                url: window.location.href,
                exp: expId,
                v: variationId,
                vwo_uuid: getVisitorUuid(),
                user_type: user_type,
              };
              if (errorType == "initIntegrationCallback") {
                errorPayload["log_type"] = "initIntegrationCallback";
                errorPayload["data"] = JSON.stringify(data || "");
              } else if (errorType == "timeout") {
                errorPayload["timeout"] = true;
              }
              if (window.VWO._.customError) {
                window.VWO._.customError({
                  msg: "integration debug",
                  url: window.location.href,
                  lineno: "",
                  colno: "",
                  source: JSON.stringify(errorPayload),
                });
              }
            } catch (e) {
              window.VWO._.customError &&
                window.VWO._.customError({
                  msg: "integration debug failed",
                  url: "",
                  lineno: "",
                  colno: "",
                  source: "",
                });
            }
          };
          var sendDebugLogs = function (
            expId,
            variationId,
            errorType,
            user_type
          ) {
            var eventName = "vwo_debugLogs";
            var eventPayload = {};
            try {
              eventPayload = {
                intName: argument["integrationName"] || "",
                varId: variationId,
                expId: expId,
                type: errorType,
                vwo_uuid: getVisitorUuid(),
                user_type: user_type,
              };
              if (window.VWO._.event) {
                window.VWO._.event(eventName, eventPayload, {
                  enableLogs: 1,
                });
              }
            } catch (e) {
              eventPayload = {
                msg: "integration event log failed",
                url: window.location.href,
              };
              window.VWO._.event && window.VWO._.event(eventName, eventPayload);
            }
          };
          var callbackFn = function (data) {
            if (!data) return;
            var expId = data[1],
              variationId = data[2],
              repeated = data[0],
              singleCall = 0,
              debug = 0;
            var experimentList = argument.getExperimentList();
            var integrationName = argument["integrationName"] || "vwo";
            if (typeof argument.accountSettings === "function") {
              var accountSettings = argument.accountSettings();
              if (accountSettings) {
                singleCall = accountSettings["singleCall"];
                debug = accountSettings["debug"];
              }
            }
            if (debug) {
              sendDebugLogs(expId, variationId, "intCallTriggered", repeated);
              sendDebugLogsOld(
                expId,
                variationId,
                "initIntegrationCallback",
                repeated
              );
            }
            if (
              (singleCall && (repeated === "vS" || repeated === "vSS")) ||
              firedCamp[expId]
            ) {
              return;
            }
            window.expList = window.expList || {};
            var expList = (window.expList[integrationName] =
              window.expList[integrationName] || []);
            if (
              expId &&
              variationId &&
              ["VISUAL_AB", "VISUAL", "SPLIT_URL"].indexOf(
                _vwo_exp[expId].type
              ) > -1
            ) {
              if (experimentList.indexOf(+expId) !== -1) {
                firedCamp[expId] = variationId;
                var visitorUuid = getVisitorUuid();
                var pollInterval = 100;
                var currentTime = 0;
                var timeout = 60000;
                var user_type = _vwo_exp[expId].exec ? "vwo-retry" : "vwo-new";
                var interval = setInterval(function () {
                  if (expList.indexOf(expId) !== -1) {
                    clearInterval(interval);
                    return;
                  }
                  currentTime = currentTime || performance.now();
                  var toClearInterval = argument.pushData(
                    expId,
                    variationId,
                    visitorUuid
                  );
                  if (debug && toClearInterval) {
                    sendDebugLogsOld(expId, variationId, "", user_type);
                    sendDebugLogs(
                      expId,
                      variationId,
                      "intDataPushed",
                      user_type
                    );
                  }
                  var isTimeout = performance.now() - currentTime >= timeout;
                  if (isTimeout && debug) {
                    sendDebugLogsOld(expId, variationId, "timeout", user_type);
                    sendDebugLogs(expId, variationId, "intTimeout", user_type);
                  }
                  if (toClearInterval || isTimeout) {
                    clearInterval(interval);
                  }
                  if (toClearInterval) {
                    window.expList[integrationName].push(expId);
                  }
                }, pollInterval || 100);
              }
            }
          };
          window.VWO.push(["onVariationApplied", callbackFn]);
          window.VWO.push(["onVariationShownSent", callbackFn]);
        };
      };
      var surveyDataCommonWrapper = function (argument) {
        window._vwoFiredSurveyEvents = window._vwoFiredSurveyEvents || {};
        if (!argument) {
          argument = {
            getCampaignList: function () {
              return [];
            },
            surveyStatusChange: function () {},
            answerSubmitted: function () {},
          };
        }
        return function () {
          window.VWO = window.VWO || [];
          function getValuesFromAnswers(answers) {
            return answers.map(function (ans) {
              return ans.value;
            });
          }
          function generateHash(str) {
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
              hash = (hash << 5) - hash + str.charCodeAt(i);
              hash |= 0;
            }
            return hash;
          }
          function getEventKey(data, status) {
            if (status === "surveySubmitted") {
              var values = getValuesFromAnswers(data.answers).join("|");
              return generateHash(
                data.surveyId + "_" + data.questionText + "_" + values
              );
            } else {
              return data.surveyId + "_" + status;
            }
          }
          function commonSurveyCallback(data, callback, surveyStatus) {
            if (!data) return;
            var surveyId = data.surveyId;
            var campaignList = argument.getCampaignList();
            if (surveyId && campaignList.indexOf(+surveyId) !== -1) {
              var eventKey = getEventKey(data, surveyStatus);
              if (window._vwoFiredSurveyEvents[eventKey]) return;
              window._vwoFiredSurveyEvents[eventKey] = true;
              var surveyData = {
                accountId: data.accountId,
                surveyId: data.surveyId,
                uuid: data.uuid,
              };
              if (surveyStatus === "surveySubmitted") {
                Object.assign(surveyData, {
                  questionType: data.questionType,
                  questionText: data.questionText,
                  answers: data.answers,
                  answersValue: getValuesFromAnswers(data.answers),
                  skipped: data.skipped,
                });
              }
              var pollInterval = 100;
              var currentTime = 0;
              var timeout = 60000;
              var interval = setInterval(function () {
                currentTime = currentTime || performance.now();
                var done = callback(surveyId, surveyStatus, surveyData);
                var expired = performance.now() - currentTime >= timeout;
                if (done || expired) {
                  window._vwoFiredSurveyEvents[eventKey] = true;
                  clearInterval(interval);
                }
              }, pollInterval);
            }
          }
          window.VWO.push([
            "onSurveyShown",
            function (data) {
              commonSurveyCallback(
                data,
                argument.surveyStatusChange,
                "surveyShown"
              );
            },
          ]);
          window.VWO.push([
            "onSurveyCompleted",
            function (data) {
              commonSurveyCallback(
                data,
                argument.surveyStatusChange,
                "surveyCompleted"
              );
            },
          ]);
          window.VWO.push([
            "onSurveyAnswerSubmitted",
            function (data) {
              commonSurveyCallback(
                data,
                argument.answerSubmitted,
                "surveySubmitted"
              );
            },
          ]);
        };
      };
      (function () {
        var VWOOmniTemp = {};
        window.VWOOmni = window.VWOOmni || {};
        for (var key in VWOOmniTemp)
          Object.prototype.hasOwnProperty.call(VWOOmniTemp, key) &&
            (window.VWOOmni[key] = VWOOmniTemp[key]);
        pushBasedCommonWrapper({
          integrationName: "snowplow",
          getExperimentList: function () {
            return [656, 650, 649, 642];
          },
          accountSettings: function () {
            return {
              snoplowIntegrationVersion: 2,
              customImplementation: false,
              instanceName: "",
            };
          },
          pushData: function (expId, variationId, visitorUuid) {
            var snowplowSettings = {
              snoplowIntegrationVersion: 2,
              customImplementation: false,
              instanceName: "",
            };
            var version =
              snowplowSettings && snowplowSettings.snoplowIntegrationVersion
                ? snowplowSettings.snoplowIntegrationVersion
                : 2;
            var data = {
              category: "VWO",
              action: expId + ":" + window._vwo_exp[expId].name,
              label:
                variationId + ":" + window._vwo_exp[expId].comb_n[variationId],
              property: visitorUuid,
            };
            var snowplowInstance =
              snowplowSettings && snowplowSettings.instanceName
                ? snowplowSettings.instanceName
                : "snowplow";
            if (window[snowplowInstance]) {
              if (version === 3) {
                window[snowplowInstance]("trackStructEvent", data);
              } else {
                if (!window.Snowplow) {
                  window[snowplowInstance]("trackStructEvent", data);
                } else {
                  window[snowplowInstance](
                    "trackStructEvent",
                    data.category,
                    data.action,
                    data.label,
                    data.property
                  );
                }
              }
              return true;
            }
            return false;
          },
        })();
        window._vwoIntegrationsLoaded = 1;
        pushBasedCommonWrapper({
          integrationName: "GA4",
          getExperimentList: function () {
            return [656, 650, 649, 642];
          },
          accountSettings: function () {
            var accountIntegrationSettings = {};
            if (
              accountIntegrationSettings["debugType"] == "ga4" &&
              accountIntegrationSettings["debug"]
            ) {
              accountIntegrationSettings["debug"] = 1;
            } else {
              accountIntegrationSettings["debug"] = 0;
            }
            return accountIntegrationSettings;
          },
          pushData: function (expId, variationId) {
            var accountIntegrationSettings = {};
            var ga4Setup = accountIntegrationSettings["setupVia"] || "gtag";
            if (typeof window.gtag !== "undefined" && ga4Setup == "gtag") {
              window.gtag("event", "VWO", {
                vwo_campaign_name: window._vwo_exp[expId].name + ":" + expId,
                vwo_variation_name:
                  window._vwo_exp[expId].comb_n[variationId] +
                  ":" +
                  variationId,
              });
              window.gtag("event", "experience_impression", {
                exp_variant_string: "VWO-" + expId + "-" + variationId,
              });
              return true;
            }
            return false;
          },
        })();
        pushBasedCommonWrapper({
          integrationName: "GA4-GTM",
          getExperimentList: function () {
            return [656, 650, 649, 642];
          },
          accountSettings: function () {
            var accountIntegrationSettings = {};
            if (
              accountIntegrationSettings["debugType"] == "gtm" &&
              accountIntegrationSettings["debug"]
            ) {
              accountIntegrationSettings["debug"] = 1;
            } else {
              accountIntegrationSettings["debug"] = 0;
            }
            return accountIntegrationSettings;
          },
          pushData: function (expId, variationId) {
            var accountIntegrationSettings = {};
            var ga4Setup = accountIntegrationSettings["setupVia"] || "gtm";
            var dataVariable =
              accountIntegrationSettings["dataVariable"] || "dataLayer";
            if (
              typeof window[dataVariable] !== "undefined" &&
              ga4Setup == "gtm"
            ) {
              window[dataVariable].push({
                event: "vwo-data-push-ga4",
                vwo_exp_variant_string: "VWO-" + expId + "-" + variationId,
              });
              return true;
            }
            return false;
          },
        })();
      })();
      (function () {
        window.VWO = window.VWO || [];
        var pollInterval = 100;
        var _vis_data = {};
        var intervalObj = {};
        var analyticsTimerObj = {};
        var experimentListObj = {};
        window.VWO.push([
          "onVariationApplied",
          function (data) {
            if (!data) {
              return;
            }
            var expId = data[1],
              variationId = data[2];
            if (
              expId &&
              variationId &&
              ["VISUAL_AB", "VISUAL", "SPLIT_URL"].indexOf(
                window._vwo_exp[expId].type
              ) > -1
            ) {
            }
          },
        ]);
      })();
      var vD = VWO.data || {};
      VWO.data = {
        content: {
          fns: {
            list: {
              args: {
                1: {},
              },
              vn: 1,
            },
          },
        },
        as: "r2eu01.visualwebsiteoptimizer.com",
        dacdnUrl: "https://dev.visualwebsiteoptimizer.com",
        accountJSInfo: {
          collUrl: "https://dev.visualwebsiteoptimizer.com/eu01/",
          rp: 60,
          pc: {
            t: 0,
            a: 0,
          },
          pvn: 0,
          url: {},
          noSS: false,
          ts: 1755863309,
        },
      };
      for (var k in vD) {
        VWO.data[k] = vD[k];
      }
      var gcpfb = function (a, loadFunc, status, err, success) {
        function vwoErr() {
          _vwo_err({
            message: "Google_Cdn failing for " + a + ". Trying Fallback..",
            code: "cloudcdnerr",
            status: status,
          });
        }
        if (a.indexOf("/cdn/") !== -1) {
          loadFunc(a.replace("cdn/", ""), err, success);
          vwoErr();
          return true;
        } else if (a.indexOf("/dcdn/") !== -1 && a.indexOf("evad.js") !== -1) {
          loadFunc(a.replace("dcdn/", ""), err, success);
          vwoErr();
          return true;
        }
      };
      window.VWO = window.VWO || [];
      window.VWO._ = window.VWO._ || {};
      window.VWO._.gcpfb = gcpfb;
      window._vwoCc = window._vwoCc || {};
      if (typeof window._vwoCc.dAM === "undefined") {
        window._vwoCc.dAM = 1;
      }
      var d = {
        cookie: document.cookie,
        URL: document.URL,
        referrer: document.referrer,
      };
      var w = {
        VWO: {
          _: {},
        },
        location: {
          href: window.location.href,
          search: window.location.search,
        },
        _vwoCc: window._vwoCc,
      };
      window._vwo_cdn = "https://dev.visualwebsiteoptimizer.com/cdn/";
      window._vwo_apm_debug_cdn = "https://dev.visualwebsiteoptimizer.com/cdn/";
      window.VWO._.useCdn = true;
      window.vwo_eT = "br";
      window._VWO = window._VWO || {};
      window._VWO.fSeg = ["650"];
      window._VWO.dcdnUrl = "/dcdn/settings.js";
      window.VWO.sTs = 1755861240;
      window._VWO._vis_nc_lib =
        window._vwo_cdn + "edrv/nc-e9bfac9e0a34a02aa5dbed0a0d55a7ef.br.js";
      var loadWorker = function (url) {
        _vwo_code.load(url, {
          dSC: true,
          onloadCb: function (xhr, a) {
            window._vwo_wt_l = true;
            if (xhr.status === 200 || xhr.status === 304) {
              var code =
                "var window=" +
                JSON.stringify(w) +
                ",document=" +
                JSON.stringify(d) +
                ";window.document=document;" +
                xhr.responseText;
              var blob = new Blob(
                  [code || "throw new Error('code not found!');"],
                  {
                    type: "application/javascript",
                  }
                ),
                url = URL.createObjectURL(blob);
              var CoreWorker = window.VWO.WorkerRef || window.Worker;
              window.mainThread = {
                webWorker: new CoreWorker(url),
              };
              window.vwoChannelFW = new MessageChannel();
              window.vwoChannelToW = new MessageChannel();
              window.mainThread.webWorker.postMessage(
                {
                  vwoChannelToW: vwoChannelToW.port1,
                  vwoChannelFW: vwoChannelFW.port2,
                },
                [vwoChannelToW.port1, vwoChannelFW.port2]
              );
              if (!window._vwo_mt_f) return (window._vwo_wt_f = true);
              _vwo_code.addScript({
                text: window._vwo_mt_f,
              });
              delete window._vwo_mt_f;
            } else {
              if (gcpfb(a, loadWorker, xhr.status)) {
                return;
              }
              _vwo_code.finish("&e=loading_failure:" + a);
            }
          },
          onerrorCb: function (a) {
            if (gcpfb(a, loadWorker)) {
              return;
            }
            window._vwo_wt_l = true;
            _vwo_code.finish("&e=loading_failure:" + a);
          },
        });
      };
      loadWorker(
        "https://dev.visualwebsiteoptimizer.com/cdn/edrv/worker-493dc5019240a1584f8f70a5a98b8e2f.br.js"
      );
      var _vis_opt_file;
      var _vis_opt_lib;
      var check_vn = function f() {
        try {
          var [r, n, t] = window.jQuery.fn.jquery.split(".").map(Number);
          return 2 === r || (1 === r && (4 < n || (4 === n && 2 <= t)));
        } catch (r) {
          return !1;
        }
      };
      var uxj =
        vwoCode.use_existing_jquery &&
        typeof vwoCode.use_existing_jquery() !== "undefined";
      var lJy = uxj && vwoCode.use_existing_jquery() && check_vn();
      if (
        window.VWO._.allSettings.dataStore.previewExtraSettings != undefined &&
        window.VWO._.allSettings.dataStore.previewExtraSettings
          .isSurveyPreviewMode
      ) {
        var surveyHash =
          window.VWO._.allSettings.dataStore.plugins.LIBINFO.SURVEY_DEBUG_EVENTS
            .HASH;
        var param1 = "evad.js?va=";
        var param2 = "&d=debugger_new";
        var param3 = "&sp=1&a=737109&sh=" + surveyHash;
        _vis_opt_file = uxj
          ? lJy
            ? param1 + "vanj" + param2
            : param1 + "va_gq" + param2
          : param1 +
            "edrv/va_gq-93c2bd0bf9b18986842ce252aa870e5c.br.js" +
            param2;
        _vis_opt_file = _vis_opt_file + param3;
        _vis_opt_lib =
          "https://dev.visualwebsiteoptimizer.com/dcdn/" + _vis_opt_file;
      } else if (
        window.VWO._.allSettings.dataStore.mode != undefined &&
        window.VWO._.allSettings.dataStore.mode == "PREVIEW"
      ) {
        var path1 = "edrv/pd_";
        var path2 =
          window.VWO._.allSettings.dataStore.plugins.LIBINFO.EVAD.HASH + ".js";
        _vis_opt_file = uxj
          ? lJy
            ? path1 + "vanj.js"
            : path1 + "va_gq" + path2
          : path1 + "edrv/va_gq-93c2bd0bf9b18986842ce252aa870e5c.br.js" + path2;
        _vis_opt_lib =
          "https://dev.visualwebsiteoptimizer.com/cdn/" + _vis_opt_file;
      } else {
        var vaGqFile = "edrv/va_gq-93c2bd0bf9b18986842ce252aa870e5c.br.js";
        _vis_opt_file = uxj
          ? lJy
            ? "edrv/vanj-039ce3b439ed5a4f1b0832208e895c2e.br.js"
            : vaGqFile
          : "edrv/va_gq-93c2bd0bf9b18986842ce252aa870e5c.br.js";
        if (_vis_opt_file.indexOf("vanj") > -1 && !check_vn()) {
          _vis_opt_file = vaGqFile;
        }
      }
      (window._vwo_library_timer = setTimeout(
        function () {
          vwoCode.removeLoaderAndOverlay && vwoCode.removeLoaderAndOverlay();
          vwoCode.finish();
        },
        vwoCode.library_tolerance &&
          typeof vwoCode.library_tolerance() !== "undefined"
          ? vwoCode.library_tolerance()
          : 2500
      )),
        (_vis_opt_lib =
          typeof _vis_opt_lib == "undefined"
            ? window._vwo_cdn + _vis_opt_file
            : _vis_opt_lib);
      var loadLib = function (url) {
        _vwo_code.load(url, {
          dSC: true,
          onloadCb: function (xhr, a) {
            window._vwo_mt_l = true;
            if (xhr.status === 200 || xhr.status === 304) {
              if (!window._vwo_wt_f)
                return (window._vwo_mt_f = xhr.responseText);
              _vwo_code.addScript({
                text: xhr.responseText,
              });
              delete window._vwo_wt_f;
            } else {
              if (gcpfb(a, loadLib, xhr.status)) {
                return;
              }
              _vwo_code.finish("&e=loading_failure:" + a);
            }
          },
          onerrorCb: function (a) {
            if (gcpfb(a, loadLib)) {
              return;
            }
            window._vwo_mt_l = true;
            _vwo_code.finish("&e=loading_failure:" + a);
          },
        });
      };
      loadLib(_vis_opt_lib);
      VWO.load_co = function (u, opts) {
        return window._vwo_code.load(u, opts);
      };
    }
  } catch (e) {
    _vwo_code.finish();
    _vwo_code.removeLoaderAndOverlay && _vwo_code.removeLoaderAndOverlay();
    _vwo_err(e);
    window.VWO.caE = 1;
  }
})();
