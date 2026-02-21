// rules/index.js
// Export all rule files

const accessibilityRules = require("./accessibility-rules");
const antiDebugRules = require("./anti-debug-rules");
const complexityRules = require("./complexity-rules");
const deobfuscationRules = require("./deobfuscation-rules");
const es6Rules = require("./es6-rules");
const i18nRules = require("./i18n-rules");
const namingRules = require("./naming-rules");
const patternRules = require("./pattern-rules");
const performanceRules = require("./performance-rules");
const reactRules = require("./react-rules");
const securityRules = require("./security-rules");
const styleRules = require("./style-rules");
const testingRules = require("./testing-rules");
const typescriptRules = require("./typescript-rules");
const validationRules = require("./validation-rules");

module.exports = {
  accessibilityRules,
  antiDebugRules,
  complexityRules,
  deobfuscationRules,
  es6Rules,
  i18nRules,
  namingRules,
  patternRules,
  performanceRules,
  reactRules,
  securityRules,
  styleRules,
  testingRules,
  typescriptRules,
  validationRules,

  // Combined rules
  allRules: {
    ...accessibilityRules,
    ...antiDebugRules,
    ...complexityRules,
    ...deobfuscationRules,
    ...es6Rules,
    ...i18nRules,
    ...namingRules,
    ...patternRules,
    ...performanceRules,
    ...reactRules,
    ...securityRules,
    ...styleRules,
    ...testingRules,
    ...typescriptRules,
    ...validationRules,
  },
};
