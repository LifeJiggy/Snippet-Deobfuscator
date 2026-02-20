"use strict";
(globalThis.webpackChunk = globalThis.webpackChunk || []).push([
  [
    "app_assets_modules_github_profile_edit-social-account_ts-app_assets_modules_github_settings_p-eaaedf",
  ],
  {
    62917: (e, t, n) => {
      var o = n(39595),
        i = n(97325),
        r = n(26559);
      function s(e, t, n) {
        return (
          t in e
            ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0,
              })
            : (e[t] = n),
          e
        );
      }
      function a(e, t, n, o) {
        var i,
          r = arguments.length,
          s =
            r < 3
              ? t
              : null === o
              ? (o = Object.getOwnPropertyDescriptor(t, n))
              : o;
        if ("object" == typeof Reflect && "function" == typeof Reflect.decorate)
          s = Reflect.decorate(e, t, n, o);
        else
          for (var a = e.length - 1; a >= 0; a--)
            (i = e[a]) &&
              (s = (r < 3 ? i(s) : r > 3 ? i(t, n, s) : i(t, n)) || s);
        return r > 3 && s && Object.defineProperty(t, n, s), s;
      }
      let l = class WaitingFormElement extends HTMLElement {
        async submitPolitely() {
          this.submit.disabled = !0;
          try {
            this.prerequisites.length > 0 &&
              (await Promise.all(
                this.prerequisites.map((e) => this.getPrerequisitePromise(e))
              )),
              (0, i.k_)(this.form);
          } finally {
            this.submit.disabled = !1;
          }
        }
        getPrerequisitePromise(e) {
          let t = e.getAttribute("data-waiting-form-method") || "getPromise";
          return e[t]();
        }
      };
      a([o.aC], l.prototype, "form", void 0),
        a([o.zV], l.prototype, "prerequisites", void 0),
        a([o.aC], l.prototype, "submit", void 0),
        (l = a([o.p_], l));
      let SocialAccountEditorElement = class SocialAccountEditorElement extends HTMLElement {
        recognizeUrl() {
          this.recognitionPromise = new Promise(async (e) => {
            this.preprocessUrl();
            let t = await this.findMatchingSocialAccountIconOption(
              this.urlField.value
            );
            this.setChosenSocialIcon(t), e();
          });
        }
        resetToDefault() {
          this.urlField.value !== this.urlField.defaultValue &&
            (0, i.m$)(this.urlField, this.urlField.defaultValue);
        }
        waitForRecognition() {
          return this.recognitionPromise;
        }
        preprocessUrl() {
          let e = this.urlField.value.trim();
          0 !== e.length &&
            (/^https?:\/\//.test(e) || (this.urlField.value = `https://${e}`));
        }
        setChosenSocialIcon(e) {
          let t = e.getAttribute("data-provider-key") || "generic";
          for (let t of this.iconOptions) t.hidden = t !== e;
          (this.iconSpinner.hidden = !0), (this.iconField.value = t);
        }
        async findMatchingSocialAccountIconOption(e) {
          for (let t of this.iconOptions)
            for (let n of t.querySelectorAll("[data-provider-pattern]"))
              if (RegExp(n.getAttribute("data-provider-pattern"), "i").test(e))
                return t;
          let t = await this.findNodeInfoIconOption(e);
          return t || this.iconGeneric;
        }
        async findNodeInfoIconOption(e) {
          if (0 === this.nodeinfoSoftwareUrl.trim().length) return null;
          let t = new Map();
          for (let n of this.iconOptions)
            for (let o of n.querySelectorAll("[data-try-nodeinfo-pattern]")) {
              let i = RegExp(o.getAttribute("data-try-nodeinfo-pattern"), "i"),
                r = o.getAttribute("data-nodeinfo-software");
              e.match(i) && r && t.set(r, n);
            }
          if (0 === t.size) return null;
          let n = null;
          try {
            n = new URL(e, window.location.origin);
          } catch {
            return null;
          }
          this.showSpinner();
          let o = new URL(this.nodeinfoSoftwareUrl, window.location.origin);
          o.searchParams.set("host", n.host);
          let i = await fetch(o, {
              headers: {
                ...(0, r.kt)(),
                Accept: "application/json",
              },
            }),
            s = await i.json(),
            a = s?.software_name;
          return (a && t.get(a)) || null;
        }
        showSpinner() {
          for (let e of this.iconOptions) e.hidden = !0;
          this.iconSpinner.hidden = !1;
        }
        constructor(...e) {
          super(...e),
            s(this, "nodeinfoSoftwareUrl", ""),
            s(this, "recognitionPromise", Promise.resolve());
        }
      };
      a([o.aC], SocialAccountEditorElement.prototype, "urlField", void 0),
        a([o.aC], SocialAccountEditorElement.prototype, "iconField", void 0),
        a([o.zV], SocialAccountEditorElement.prototype, "iconOptions", void 0),
        a([o.aC], SocialAccountEditorElement.prototype, "iconGeneric", void 0),
        a([o.aC], SocialAccountEditorElement.prototype, "iconSpinner", void 0),
        a(
          [o.CF],
          SocialAccountEditorElement.prototype,
          "nodeinfoSoftwareUrl",
          void 0
        ),
        (SocialAccountEditorElement = a([o.p_], SocialAccountEditorElement));
    },
    48954: (e, t, n) => {
      (0, n(97797).on)(
        "change",
        ".js-profile-editable-pronouns-select",
        function () {
          let e = document.querySelector(
              ".js-profile-editable-pronouns-select"
            ),
            t = document.querySelector(".js-profile-editable-pronouns-custom"),
            n = t.getAttribute("data-initial-value");
          "Custom" === e.value
            ? ([...e.options].find((e) => e.value === n)
                ? (t.value = "")
                : (t.value = n),
              (t.hidden = !1),
              t.focus())
            : ((t.value = e.value), (t.hidden = !0));
        }
      );
    },
    52811: (e, t, n) => {
      n.d(t, {
        C: () => s,
        i: () => a,
      });
      var o = n(96679),
        i = n(27851),
        r = n(46493);
      function s(e, t) {
        (0, i.G7)("arianotify_comprehensive_migration")
          ? a(l(e), {
              ...t,
              element: t?.element ?? e,
            })
          : (0, i.G7)("primer_live_region_element") && t?.element === void 0
          ? (0, r.Cj)(e, {
              politeness: t?.assertive ? "assertive" : "polite",
            })
          : a(l(e), t);
      }
      function a(e, t) {
        let { assertive: n, element: s } = t ?? {};
        (0, i.G7)("arianotify_comprehensive_migration") &&
        "ariaNotify" in Element.prototype
          ? (s || document.body).ariaNotify(e)
          : (0, i.G7)("primer_live_region_element") && void 0 === s
          ? (0, r.iP)(e, {
              politeness: n ? "assertive" : "polite",
            })
          : (function (e, t, n) {
              let i =
                n ??
                o.XC?.querySelector(
                  t
                    ? "#js-global-screen-reader-notice-assertive"
                    : "#js-global-screen-reader-notice"
                );
              i &&
                (i.textContent === e
                  ? (i.textContent = `${e}\u00A0`)
                  : (i.textContent = e));
            })(e, n, s);
      }
      function l(e) {
        return (e.getAttribute("aria-label") || e.innerText || "").trim();
      }
    },
    53005: (e, t, n) => {
      n.d(t, {
        O: () => s,
        S: () => r,
      });
      var o = n(96679);
      let i =
          o.cg?.document?.head?.querySelector('meta[name="release"]')
            ?.content || "",
        r = "X-GitHub-Client-Version";
      function s() {
        return i;
      }
    },
    26559: (e, t, n) => {
      n.d(t, {
        jC: () => l,
        kt: () => s,
        tV: () => a,
      });
      var o = n(53005),
        i = n(27851),
        r = n(88191);
      function s(e) {
        let t = {
          "X-Requested-With": "XMLHttpRequest",
          ...(0, r.wE)(e),
        };
        return (
          (0, i.G7)("client_version_header") &&
            (t = {
              ...t,
              [o.S]: (0, o.O)(),
            }),
          t
        );
      }
      function a(e, t) {
        for (let [n, o] of Object.entries(s(t))) e.set(n, o);
      }
      function l(e) {
        return {
          "X-GitHub-App-Type": e,
        };
      }
    },
    88191: (e, t, n) => {
      n.d(t, {
        $r: () => s,
        M1: () => a,
        li: () => i,
        pS: () => c,
        wE: () => l,
      });
      var o = n(96679);
      let i = "X-Fetch-Nonce",
        r = new Set();
      function s(e) {
        r.add(e);
      }
      function a() {
        return r.values().next().value || "";
      }
      function l(e) {
        let t = {};
        return (
          void 0 !== e && (t["X-Fetch-Nonce-To-Validate"] = e),
          void 0 === e
            ? (t[i] = a())
            : r.has(e)
            ? (t[i] = e)
            : (t[i] = Array.from(r).join(",")),
          t
        );
      }
      function c() {
        let e =
          o.XC?.head?.querySelector('meta[name="fetch-nonce"]')?.content || "";
        e && s(e);
      }
    },
    20451: (e, t, n) => {
      n.d(t, {
        Ee: () => a,
        b4: () => l,
        Ts: () => s,
      });
      let o = class ResponseError extends Error {
        constructor(e, t) {
          super(`${e} for HTTP ${t.status}`),
            (function (e, t, n) {
              t in e
                ? Object.defineProperty(e, t, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                  })
                : (e[t] = n);
            })(this, "response", void 0),
            (this.response = t),
            (this.name = "ResponseError");
        }
      };
      var i = n(1739),
        r = n(26559);
      async function s(e, t, n) {
        let s = new Request(t, n);
        (0, r.tV)(s.headers);
        let a = await self.fetch(s);
        if (a.status < 200 || a.status >= 300)
          throw Error(`HTTP ${a.status}${a.statusText || ""}`);
        return (
          !(function (e, t, n = !1) {
            let i = t.headers.get("content-type") || "";
            if (!n && !i.startsWith("text/html"))
              throw new o(`expected response with text/html, but was ${i}`, t);
            if (
              n &&
              !(i.startsWith("text/html") || i.startsWith("application/json"))
            )
              throw new o(
                `expected response with text/html or application/json, but was ${i}`,
                t
              );
            let r = t.headers.get("x-html-safe");
            if (r) {
              if (!e.includes(r))
                throw new o("response X-HTML-Safe nonce did not match", t);
            } else throw new o("missing X-HTML-Safe nonce", t);
          })(
            (function (e) {
              let t = [...e.querySelectorAll("meta[name=html-safe-nonce]")].map(
                (e) => e.content
              );
              if (t.length < 1)
                throw Error("could not find html-safe-nonce on document");
              return t;
            })(e),
            a
          ),
          (0, i.B)(e, await a.text())
        );
      }
      function a(e, t, n = 1e3, o = [200], i = [202]) {
        return (async function n(s) {
          let a = new Request(e, t);
          (0, r.tV)(a.headers);
          let l = await self.fetch(a);
          if (i.includes(l.status))
            return await new Promise((e) => setTimeout(e, s)), n(1.5 * s);
          if (o.includes(l.status)) return l;
          if (l.status < 200 || l.status >= 300)
            throw Error(`HTTP ${l.status}${l.statusText || ""}`);
          throw Error(
            `Unexpected ${l.status} response status from poll endpoint`
          );
        })(n);
      }
      async function l(e, t, n) {
        let {
            wait: o = 500,
            acceptedStatusCodes: i = [200],
            max: s = 3,
            attempt: a = 0,
          } = n || {},
          c = async () =>
            new Promise((n, l) => {
              setTimeout(async () => {
                try {
                  let o = new Request(e, t);
                  (0, r.tV)(o.headers);
                  let l = await self.fetch(o);
                  if (i.includes(l.status) || a + 1 === s) return n(l);
                  n("retry");
                } catch (e) {
                  l(e);
                }
              }, o * a);
            }),
          u = await c();
        return "retry" !== u
          ? u
          : l(e, t, {
              wait: o,
              acceptedStatusCodes: i,
              max: s,
              attempt: a + 1,
            });
      }
    },
    97325: (e, t, n) => {
      n.d(t, {
        Cy: () => a,
        K3: () => u,
        Z8: () => l,
        k_: () => r,
        lK: () => f,
        m$: () => s,
      });
      var o = n(94982);
      function i(e, t, n) {
        return e.dispatchEvent(
          new CustomEvent(t, {
            bubbles: !0,
            cancelable: n,
          })
        );
      }
      function r(e, t) {
        t &&
          ((function (e, t) {
            if (!(e instanceof HTMLFormElement))
              throw TypeError(
                "The specified element is not of type HTMLFormElement."
              );
            if (!(t instanceof HTMLElement))
              throw TypeError(
                "The specified element is not of type HTMLElement."
              );
            if ("submit" !== t.type)
              throw TypeError("The specified element is not a submit button.");
            if (!e || e !== t.form)
              throw Error(
                "The specified element is not owned by the form element."
              );
          })(e, t),
          (0, o.A)(t)),
          i(e, "submit", !0) && e.submit();
      }
      function s(e, t) {
        if ("boolean" == typeof t)
          if (e instanceof HTMLInputElement) e.checked = t;
          else throw TypeError("only checkboxes can be set to boolean value");
        else if ("checkbox" === e.type)
          throw TypeError("checkbox can't be set to string value");
        else e.value = t;
        i(e, "change", !1);
      }
      function a(e, t) {
        for (let n in t) {
          let o = t[n],
            i = e.elements.namedItem(n);
          i instanceof HTMLInputElement
            ? (i.value = o)
            : i instanceof HTMLTextAreaElement && (i.value = o);
        }
      }
      function l(e) {
        if (!(e instanceof HTMLElement)) return !1;
        let t = e.nodeName.toLowerCase(),
          n = (e.getAttribute("type") || "").toLowerCase();
        return (
          "select" === t ||
          "textarea" === t ||
          ("input" === t && "submit" !== n && "reset" !== n) ||
          e.isContentEditable
        );
      }
      function c(e) {
        return new URLSearchParams(e);
      }
      function u(e, t) {
        let n = new URLSearchParams(e.search);
        for (let [e, o] of c(t)) n.append(e, o);
        return n.toString();
      }
      function f(e) {
        return c(new FormData(e)).toString();
      }
    },
    94982: (e, t, n) => {
      function o(e) {
        let t = e.closest("form");
        if (!(t instanceof HTMLFormElement)) return;
        let n = i(t);
        if (e.name) {
          let o = e.matches("input[type=submit]") ? "Submit" : "",
            i = e.value || o;
          n ||
            (((n = document.createElement("input")).type = "hidden"),
            n.classList.add("js-submit-button-value"),
            t.prepend(n)),
            (n.name = e.name),
            (n.value = i);
        } else n && n.remove();
      }
      function i(e) {
        let t = e.querySelector("input.js-submit-button-value");
        return t instanceof HTMLInputElement ? t : null;
      }
      n.d(t, {
        A: () => o,
        C: () => i,
      });
    },
    66871: (e, t, n) => {
      n.d(t, {
        C3: () => a,
        JV: () => i,
        K3: () => f,
        MM: () => l,
        OE: () => d,
        Zu: () => u,
        bj: () => r,
        jc: () => c,
        kd: () => s,
      });
      var o = n(96679);
      function i() {
        return o.Kn?.state || {};
      }
      function r(e) {
        p(i(), "", e);
      }
      function s(e) {
        o.Kn?.pushState(
          {
            appId: i().appId,
          },
          "",
          e
        ),
          h();
      }
      function a(e) {
        p(
          {
            ...i(),
            ...e,
          },
          "",
          location.href
        );
      }
      function l(e) {
        r(`?${e.toString()}${o.fV.hash}`);
      }
      function c() {
        r(o.fV.pathname + o.fV.hash);
      }
      function u(e) {
        r(e.startsWith("#") ? e : `#${e}`);
      }
      function f() {
        r(o.fV.pathname + o.fV.search);
      }
      function d() {
        o.Kn?.back();
      }
      function p(e, t, n) {
        o.Kn?.replaceState(e, t, n), h();
      }
      function h() {
        o.cg?.dispatchEvent(
          new CustomEvent("statechange", {
            bubbles: !1,
            cancelable: !1,
          })
        );
      }
    },
    1739: (e, t, n) => {
      n.d(t, {
        B: () => o,
      });
      function o(e, t) {
        let n = e.createElement("template");
        return (n.innerHTML = t), e.importNode(n.content, !0);
      }
    },
    12559: (e, t, n) => {
      n.d(t, {
        Ax: () => i.Ax,
        JW: () => r,
        ZV: () => i.ZV,
      });
      var o = n(26559),
        i = n(13937);
      function r(e, t) {
        (0, i.JW)(e, async (e, n, i) => ((0, o.tV)(i.headers), t(e, n, i)));
      }
    },
  },
]);
//# sourceMappingURL=app_assets_modules_github_profile_edit-social-account_ts-app_assets_modules_github_settings_p-eaaedf-9b84e7403962.js.map
