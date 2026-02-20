const { deobfuscateSnippet } = require("./index.js");

const { recognizePatterns } = require("./patterns");
const { suggestNames } = require("./renamer");
const { detectFunctionality } = require("./detector");
const {
  applyReactEventSystemRenaming,
  applyAdvancedReactRenaming, // This is now a pass-through
  applyReactComponentRenaming, // This handles React components/hooks
  applyModuleContextRenaming,
} = require("./patterns");

const snippet = `
function s(e, t, n) {
  var r = new Set(e),
    o = r.size;
  return (
    (0, i.YR)(t, {
      Directive: function (e) {
        if (r.delete(e.name.value) && (!n || !r.size)) return i.sP;
      },
    }),
    n ? !r.size : r.size < o
  );
}
function u(e) {
  return e && s(["client", "export"], e, !0);
}
function c(e) {
  var t,
    n,
    i =
      null === (t = e.directives) || void 0 === t
        ? void 0
        : t.find(function (e) {
            return "unmask" === e.name.value;
          });
  if (!i) return "mask";
  var a =
    null === (n = i.arguments) || void 0 === n
      ? void 0
      : n.find(function (e) {
          return "mode" === e.name.value;
        });
  return (
    !1 !== globalThis.__DEV__ &&
      a &&
      (a.value.kind === o.b.VARIABLE
        ? !1 !== globalThis.__DEV__ && r.V1.warn(82)
        : a.value.kind !== o.b.STRING
        ? !1 !== globalThis.__DEV__ && r.V1.warn(83)
        : "migrate" !== a.value.value &&
          !1 !== globalThis.__DEV__ &&
          r.V1.warn(84, a.value.value)),
    a && "value" in a.value && "migrate" === a.value.value
      ? "migrate"
      : "unmask"
  );
}
  
`;

const result = deobfuscateSnippet(snippet);

// Display formatted output
console.log("\n=== DEOBFUSCATED CODE ===");
console.log("------------------------");
console.log(result.code);
console.log("------------------------\n");

// Display patterns
console.log("=== DETECTED PATTERNS ===");
console.log("------------------------");
if (result.patterns && result.patterns.length > 0) {
  result.patterns.forEach((pattern) => {
    console.log(`• ${pattern.name}: ${pattern.description}`);
  });
} else {
  console.log("No patterns detected");
}
console.log();

// Display functionality with details
console.log("=== FUNCTIONALITY DETECTED ===");
console.log("-----------------------------");
if (result.functionality && result.functionality.length > 0) {
  result.functionality.forEach((func) => {
    console.log(`\n• ${func.type}`);
    console.log(`  Description: ${func.description}`);
    console.log(`  Location: Line ${func.location?.startLine || "?"}`);
    if (func.codeSnippet) {
      console.log(`  Code: ${func.codeSnippet}`);
    }
  });
} else {
  console.log("No functionality detected");
}
console.log("\n-----------------------------");

// Display name changes
console.log("\n=== NAME CHANGES ===");
console.log("------------------");
if (result.allRenames && result.allRenames.length > 0) {
  result.allRenames.forEach((rename) => {
    console.log(`• ${rename}`);
  });
} else {
  console.log("No name changes detected");
}
console.log();
