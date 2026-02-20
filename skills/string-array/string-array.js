/**
 * String Array Deobfuscation Skill
 * Detects and decodes string array obfuscation patterns in JavaScript
 * Version: 3.0.0
 */

class StringArraySkill {
  constructor() {
    this.name = "string-array";
    this.version = "3.0.0";
    this.cache = new Map();
    this.stats = {
      arraysDetected: 0,
      stringsDecoded: 0,
      replacements: 0,
      failures: 0,
    };
    this.patterns = this.initializePatterns();
  }

  initializePatterns() {
    return {
      stringArray: /var\s+(_0x[a-fA-F0-9]+|\w+Arr|\w+Strings)\s*=\s*\[/g,
      accessorFunction:
        /function\s+(_0x[a-fA-F0-9]+|\w+)\s*\(\s*(\w+)\s*\)\s*\{[^}]*\1\[[^\]]+\][^}]*\}/g,
      shuffleCall:
        /\(\s*function\s*\(\s*\)\s*\{[^}]*(push|unshift|pop|shift|reverse|splice)[^}]*\}/g,
      getStringCall: /(_0x[a-fA-F0-9]+|\w+)\s*\(\s*(\d+|0x[a-fA-F0-9]+)\s*\)/g,
      arrayAccess: /(_0x[a-fA-F0-9]+|\w+)\s*\[\s*(\d+|0x[a-fA-F0-9]+)\s*\]/g,
    };
  }

  analyze(code, options = {}) {
    const result = {
      deobfuscated: code,
      arrays: [],
      replacements: [],
      warnings: [],
      errors: [],
    };

    try {
      const stringArrays = this.detectStringArrays(code);

      for (const arr of stringArrays) {
        const arrayData = this.extractArrayData(code, arr);
        if (arrayData) {
          result.arrays.push(arrayData);
          this.stats.arraysDetected++;
        }
      }

      const accessorFunctions = this.detectAccessorFunctions(
        code,
        stringArrays
      );
      const shuffledArrays = this.detectShuffleOperations(code, stringArrays);

      let workingCode = code;

      for (const shuffle of shuffledArrays) {
        workingCode = this.applyShuffle(workingCode, shuffle);
      }

      for (const accessor of accessorFunctions) {
        const decoded = this.decodeAccessorFunction(workingCode, accessor);
        if (decoded) {
          workingCode = decoded.code;
          result.replacements.push(...decoded.replacements);
        }
      }

      for (const arr of stringArrays) {
        const inlined = this.inlineStringArray(workingCode, arr);
        if (inlined) {
          workingCode = inlined.code;
          this.stats.replacements += inlined.count;
        }
      }

      result.deobfuscated = workingCode;
    } catch (error) {
      result.errors.push(error.message);
      this.stats.failures++;
    }

    return result;
  }

  detectStringArrays(code) {
    const arrays = [];
    const seen = new Set();

    const arrayPattern = /var\s+([_a-zA-Z][_a-zA-Z0-9]*)\s*=\s*\[([^\]]*)\]/g;
    let match;

    while ((match = arrayPattern.exec(code)) !== null) {
      const name = match[1];
      const content = match[2];

      if (seen.has(name)) continue;
      seen.add(name);

      const values = this.parseArrayContent(content);

      if (values.length >= 2 && this.isStringArray(values)) {
        arrays.push({
          name,
          values,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          raw: match[0],
        });
      }
    }

    return arrays;
  }

  parseArrayContent(content) {
    const values = [];
    const trimmed = content.trim();

    if (!trimmed) return values;

    let current = "";
    let inString = false;
    let stringChar = "";
    let escaped = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        current += char;
        escaped = true;
        continue;
      }

      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === stringChar && inString) {
        inString = false;
        current += char;
        values.push(current.trim());
        current = "";
        stringChar = "";
        continue;
      }

      if (char === "," && !inString) {
        if (current.trim()) {
          values.push(current.trim());
        }
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      values.push(current.trim());
    }

    return values;
  }

  isStringArray(values) {
    let stringCount = 0;
    for (const val of values) {
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        stringCount++;
      }
    }
    return stringCount / values.length >= 0.5;
  }

  extractArrayData(code, arr) {
    const accessorPattern = new RegExp(
      `function\\s+(\\w+)\\s*\\(\\s*(\\w+)\\s*\\)\\s*\\{[^}]*${arr.name}\\[[^\\]]+\\][^}]*\\}`,
      "g"
    );

    const accessors = [];
    let match;
    while ((match = accessorPattern.exec(code)) !== null) {
      accessors.push({
        name: match[1],
        param: match[2],
        full: match[0],
      });
    }

    return {
      ...arr,
      accessors,
      hasShuffle: this.checkForShuffle(code, arr.name),
    };
  }

  detectAccessorFunctions(code, arrays) {
    const accessors = [];
    const arrayNames = new Set(arrays.map((a) => a.name));

    const funcPattern = /function\s+(\w+)\s*\(\s*(\w+)\s*\)\s*\{([^}]*)\}/g;
    let match;

    while ((match = funcPattern.exec(code)) !== null) {
      const name = match[1];
      const param = match[2];
      const body = match[3];

      for (const arrName of arrayNames) {
        if (body.includes(arrName)) {
          accessors.push({
            name,
            param,
            body,
            arrayName: arrName,
            full: match[0],
            index: match.index,
          });
          break;
        }
      }
    }

    return accessors;
  }

  detectShuffleOperations(code, arrays) {
    const shuffles = [];
    const arrayNames = new Set(arrays.map((a) => a.name));

    for (const arrName of arrayNames) {
      const rotationPattern = new RegExp(
        `${arrName}\\.push\\(${arrName}\\.shift\\(\\)\\)`,
        "g"
      );

      const reversePattern = new RegExp(`${arrName}\\.reverse\\(\\)`, "g");

      let match;
      let rotationCount = 0;

      while ((match = rotationPattern.exec(code)) !== null) {
        rotationCount++;
      }

      if (rotationCount > 0) {
        shuffles.push({
          arrayName: arrName,
          type: "rotation",
          count: rotationCount,
        });
      }

      if (reversePattern.test(code)) {
        shuffles.push({
          arrayName: arrName,
          type: "reverse",
        });
      }
    }

    return shuffles;
  }

  applyShuffle(code, shuffle) {
    const arrayMatch = code.match(
      new RegExp(`var\\s+${shuffle.arrayName}\\s*=\\s*\\[([^\\]]+)\\]`)
    );

    if (!arrayMatch) return code;

    const content = arrayMatch[1];
    let values = this.parseArrayContent(content);

    if (shuffle.type === "rotation" && shuffle.count) {
      for (let i = 0; i < shuffle.count; i++) {
        values.push(values.shift());
      }
    } else if (shuffle.type === "reverse") {
      values = values.reverse();
    }

    const newArray = `var ${shuffle.arrayName} = [${values.join(", ")}]`;
    return code.replace(arrayMatch[0], newArray);
  }

  decodeAccessorFunction(code, accessor) {
    const result = {
      code,
      replacements: [],
    };

    const callPattern = new RegExp(
      `${accessor.name}\\s*\\(\\s*(\\d+|0x[a-fA-F0-9]+)\\s*\\)`,
      "g"
    );

    let match;
    let workingCode = code;

    while ((match = callPattern.exec(code)) !== null) {
      const fullMatch = match[0];
      const indexStr = match[1];
      const index = indexStr.startsWith("0x")
        ? parseInt(indexStr, 16)
        : parseInt(indexStr, 10);

      const stringValue = this.getStringFromArray(
        code,
        accessor.arrayName,
        index
      );

      if (stringValue) {
        workingCode = workingCode.replace(fullMatch, stringValue);
        result.replacements.push({
          original: fullMatch,
          replacement: stringValue,
          index,
        });
        this.stats.stringsDecoded++;
      }
    }

    result.code = workingCode;
    return result;
  }

  getStringFromArray(code, arrayName, index) {
    const arrayMatch = code.match(
      new RegExp(`var\\s+${arrayName}\\s*=\\s*\\[([^\\]]+)\\]`)
    );

    if (!arrayMatch) return null;

    const values = this.parseArrayContent(arrayMatch[1]);

    if (index < 0 || index >= values.length) return null;

    return values[index];
  }

  inlineStringArray(code, arr) {
    const result = {
      code,
      count: 0,
    };

    let workingCode = code;
    const directAccessPattern = new RegExp(
      `${arr.name}\\s*\\[\\s*(\\d+|0x[a-fA-F0-9]+)\\s*\\]`,
      "g"
    );

    let match;
    while ((match = directAccessPattern.exec(code)) !== null) {
      const fullMatch = match[0];
      const indexStr = match[1];
      const index = indexStr.startsWith("0x")
        ? parseInt(indexStr, 16)
        : parseInt(indexStr, 10);

      if (index >= 0 && index < arr.values.length) {
        workingCode = workingCode.replace(fullMatch, arr.values[index]);
        result.count++;
      }
    }

    result.code = workingCode;
    return result;
  }

  decodeBase64Strings(values) {
    return values.map((val) => {
      const str = val.replace(/^["']|["']$/g, "");
      try {
        const decoded = Buffer.from(str, "base64").toString("utf-8");
        if (this.isValidString(decoded)) {
          return `"${decoded}"`;
        }
      } catch (e) {}
      return val;
    });
  }

  isValidString(str) {
    if (!str || typeof str !== "string") return false;

    let printable = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (
        (code >= 32 && code <= 126) ||
        code === 10 ||
        code === 13 ||
        code === 9
      ) {
        printable++;
      }
    }

    return printable / str.length >= 0.7;
  }

  getStatistics() {
    return {
      ...this.stats,
      successRate:
        this.stats.replacements > 0
          ? (
              (this.stats.stringsDecoded /
                (this.stats.stringsDecoded + this.stats.failures)) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  clearCache() {
    this.cache.clear();
  }

  dispose() {
    this.cache.clear();
    this.patterns = {};
  }
}

module.exports = StringArraySkill;
