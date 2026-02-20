/**
 * Diff Utilities
 * Production-grade code diff utilities
 * Version: 3.0.0
 */
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

class Differ {
  constructor(options = {}) {
    this.name = "differ";
    this.version = "3.0.0";
    this.options = {
      ignoreWhitespace: options.ignoreWhitespace !== false,
      ignoreCase: options.ignoreCase || false,
      contextLines: options.contextLines || 3,
      plugins: options.plugins || ["jsx", "typescript"],
    };
    this.stats = {
      diffs: 0,
      additions: 0,
      deletions: 0,
      modifications: 0,
      failed: 0,
    };
  }

  diff(oldCode, newCode) {
    try {
      const oldLines = this._splitLines(oldCode);
      const newLines = this._splitLines(newCode);

      const diffResult = this._computeLineDiff(oldLines, newLines);

      this.stats.diffs++;
      this.stats.additions += diffResult.additions;
      this.stats.deletions += diffResult.deletions;

      return {
        success: true,
        diff: diffResult,
        summary: {
          additions: diffResult.additions,
          deletions: diffResult.deletions,
          changes: diffResult.chunks.length,
        },
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _splitLines(code) {
    if (typeof code !== "string") {
      return [];
    }

    let lines = code.split("\n");

    if (this.options.ignoreWhitespace) {
      lines = lines.map((line) => line.trim());
    }

    if (this.options.ignoreCase) {
      lines = lines.map((line) => line.toLowerCase());
    }

    return lines;
  }

  _computeLineDiff(oldLines, newLines) {
    const chunks = [];
    const changes = [];

    const lcs = this._longestCommonSubsequence(oldLines, newLines);

    let oldIndex = 0;
    let newIndex = 0;
    let lcsIndex = 0;

    let additions = 0;
    let deletions = 0;

    let currentChunk = null;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldMatch =
        oldIndex < oldLines.length &&
        lcsIndex < lcs.length &&
        oldLines[oldIndex] === lcs[lcsIndex];
      const newMatch =
        newIndex < newLines.length &&
        lcsIndex < lcs.length &&
        newLines[newIndex] === lcs[lcsIndex];

      if (oldMatch && newMatch) {
        if (currentChunk && currentChunk.changes.length > 0) {
          currentChunk.endOld = oldIndex;
          currentChunk.endNew = newIndex;
        }
        currentChunk = null;
        changes.push({
          type: "unchanged",
          oldLine: oldIndex + 1,
          newLine: newIndex + 1,
          content: oldLines[oldIndex],
        });
        oldIndex++;
        newIndex++;
        lcsIndex++;
      } else if (newIndex < newLines.length && !newMatch) {
        if (!currentChunk) {
          currentChunk = {
            startOld: oldIndex,
            startNew: newIndex,
            changes: [],
          };
          chunks.push(currentChunk);
        }
        currentChunk.changes.push({
          type: "addition",
          oldLine: null,
          newLine: newIndex + 1,
          content: newLines[newIndex],
        });
        changes.push({
          type: "addition",
          oldLine: null,
          newLine: newIndex + 1,
          content: newLines[newIndex],
        });
        additions++;
        newIndex++;
      } else if (oldIndex < oldLines.length && !oldMatch) {
        if (!currentChunk) {
          currentChunk = {
            startOld: oldIndex,
            startNew: newIndex,
            changes: [],
          };
          chunks.push(currentChunk);
        }
        currentChunk.changes.push({
          type: "deletion",
          oldLine: oldIndex + 1,
          newLine: null,
          content: oldLines[oldIndex],
        });
        changes.push({
          type: "deletion",
          oldLine: oldIndex + 1,
          newLine: null,
          content: oldLines[oldIndex],
        });
        deletions++;
        oldIndex++;
      } else {
        break;
      }
    }

    return { chunks, changes, additions, deletions };
  }

  _longestCommonSubsequence(arr1, arr2) {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const lcs = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  diffAST(oldAST, newAST) {
    try {
      const oldNodes = this._flattenAST(oldAST);
      const newNodes = this._flattenAST(newAST);

      const changes = [];
      const oldMap = new Map();
      const newMap = new Map();

      oldNodes.forEach((node) => {
        const key = this._getNodeKey(node);
        if (!oldMap.has(key)) {
          oldMap.set(key, []);
        }
        oldMap.get(key).push(node);
      });

      newNodes.forEach((node) => {
        const key = this._getNodeKey(node);
        if (!newMap.has(key)) {
          newMap.set(key, []);
        }
        newMap.get(key).push(node);
      });

      const processedOld = new Set();
      const processedNew = new Set();

      for (let i = 0; i < newNodes.length; i++) {
        const node = newNodes[i];
        const key = this._getNodeKey(node);

        if (!oldMap.has(key) || oldMap.get(key).length === 0) {
          changes.push({
            type: "added",
            nodeType: node.type,
            loc: node.loc,
            content: this._nodeToString(node),
          });
          this.stats.additions++;
        } else {
          const oldNode = oldMap.get(key).shift();
          processedOld.add(oldNode);
          processedNew.add(node);

          if (JSON.stringify(oldNode) !== JSON.stringify(node)) {
            changes.push({
              type: "modified",
              nodeType: node.type,
              oldLoc: oldNode.loc,
              newLoc: node.loc,
              oldContent: this._nodeToString(oldNode),
              newContent: this._nodeToString(node),
            });
            this.stats.modifications++;
          }
        }
      }

      oldNodes.forEach((node) => {
        const key = this._getNodeKey(node);
        if (
          !processedOld.has(node) &&
          (!newMap.has(key) || newMap.get(key).length === 0)
        ) {
          changes.push({
            type: "removed",
            nodeType: node.type,
            loc: node.loc,
            content: this._nodeToString(node),
          });
          this.stats.deletions++;
        }
      });

      this.stats.diffs++;

      return {
        success: true,
        changes,
        summary: {
          added: changes.filter((c) => c.type === "added").length,
          removed: changes.filter((c) => c.type === "removed").length,
          modified: changes.filter((c) => c.type === "modified").length,
        },
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _flattenAST(ast) {
    const nodes = [];

    traverse(ast, {
      enter(path) {
        nodes.push({
          type: path.node.type,
          loc: path.node.loc,
          ...path.node,
        });
      },
    });

    return nodes;
  }

  _getNodeKey(node) {
    return node.type + "_" + (node.name || node.id?.name || "");
  }

  _nodeToString(node) {
    try {
      return JSON.stringify(node, null, 2).slice(0, 200);
    } catch {
      return String(node.type);
    }
  }

  diffLines(oldCode, newCode) {
    try {
      const oldLines = this._splitLines(oldCode);
      const newLines = this._splitLines(newCode);

      const lineDiff = [];
      const maxLen = Math.max(oldLines.length, newLines.length);

      for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];

        if (oldLine === undefined) {
          lineDiff.push({
            type: "added",
            line: i + 1,
            content: newLine,
          });
          this.stats.additions++;
        } else if (newLine === undefined) {
          lineDiff.push({
            type: "removed",
            line: i + 1,
            content: oldLine,
          });
          this.stats.deletions++;
        } else if (oldLine !== newLine) {
          lineDiff.push({
            type: "modified",
            line: i + 1,
            oldContent: oldLine,
            newContent: newLine,
          });
          this.stats.modifications++;
        } else {
          lineDiff.push({
            type: "unchanged",
            line: i + 1,
            content: oldLine,
          });
        }
      }

      this.stats.diffs++;

      return {
        success: true,
        diff: lineDiff,
        oldLineCount: oldLines.length,
        newLineCount: newLines.length,
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  diffChars(oldCode, newCode) {
    try {
      const oldChars = oldCode.split("");
      const newChars = newCode.split("");

      const charDiff = [];
      const lcs = this._charLCS(oldChars, newChars);

      let oldIndex = 0;
      let newIndex = 0;
      let lcsIndex = 0;

      while (oldIndex < oldChars.length || newIndex < newChars.length) {
        const oldMatch =
          oldIndex < oldChars.length &&
          lcsIndex < lcs.length &&
          oldChars[oldIndex] === lcs[lcsIndex];
        const newMatch =
          newIndex < newChars.length &&
          lcsIndex < lcs.length &&
          newChars[newIndex] === lcs[lcsIndex];

        if (oldMatch && newMatch) {
          charDiff.push({ type: "unchanged", char: oldChars[oldIndex] });
          oldIndex++;
          newIndex++;
          lcsIndex++;
        } else if (newIndex < newChars.length && !newMatch) {
          charDiff.push({ type: "added", char: newChars[newIndex] });
          newIndex++;
        } else if (oldIndex < oldChars.length && !oldMatch) {
          charDiff.push({ type: "removed", char: oldChars[oldIndex] });
          oldIndex++;
        } else {
          break;
        }
      }

      this.stats.diffs++;

      return {
        success: true,
        diff: charDiff,
        stats: {
          added: charDiff.filter((c) => c.type === "added").length,
          removed: charDiff.filter((c) => c.type === "removed").length,
          unchanged: charDiff.filter((c) => c.type === "unchanged").length,
        },
      };
    } catch (error) {
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  _charLCS(arr1, arr2) {
    const m = arr1.length;
    const n = arr2.length;

    if (m === 0 || n === 0) return [];

    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        result.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  }

  formatDiff(diffResult, format = "unified") {
    try {
      if (!diffResult || !diffResult.success) {
        return { success: false, error: "Invalid diff result" };
      }

      let output = "";

      switch (format) {
        case "unified":
          output = this._formatUnified(diffResult);
          break;
        case "context":
          output = this._formatContext(diffResult);
          break;
        case "sidebyside":
          output = this._formatSideBySide(diffResult);
          break;
        case "html":
          output = this._formatHTML(diffResult);
          break;
        case "json":
          output = JSON.stringify(diffResult, null, 2);
          break;
        default:
          output = this._formatUnified(diffResult);
      }

      return { success: true, output, format };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _formatUnified(diffResult) {
    const lines = [];
    lines.push("--- Original");
    lines.push("+++ Modified");

    if (diffResult.diff && diffResult.diff.chunks) {
      for (const chunk of diffResult.diff.chunks) {
        lines.push(`@@ -${chunk.startOld + 1} +${chunk.startNew + 1} @@`);

        for (const change of chunk.changes) {
          if (change.type === "addition") {
            lines.push("+" + change.content);
          } else if (change.type === "deletion") {
            lines.push("-" + change.content);
          }
        }
      }
    } else if (diffResult.diff && Array.isArray(diffResult.diff)) {
      for (const change of diffResult.diff) {
        if (change.type === "added") {
          lines.push("+" + change.content);
        } else if (change.type === "removed") {
          lines.push("-" + change.content);
        } else if (change.type === "modified") {
          lines.push("-" + change.oldContent);
          lines.push("+" + change.newContent);
        } else if (change.type === "addition") {
          lines.push("+" + change.content);
        } else if (change.type === "deletion") {
          lines.push("-" + change.content);
        }
      }
    }

    return lines.join("\n");
  }

  _formatContext(diffResult) {
    const lines = [];
    const contextLines = this.options.contextLines;

    if (diffResult.diff && Array.isArray(diffResult.diff)) {
      let context = [];

      for (let i = 0; i < diffResult.diff.length; i++) {
        const change = diffResult.diff[i];

        if (change.type === "unchanged") {
          context.push("  " + change.content);
        } else {
          if (context.length > contextLines) {
            context = context.slice(-contextLines);
          }

          lines.push(...context);
          context = [];

          if (change.type === "added" || change.type === "addition") {
            lines.push("+ " + change.content);
          } else if (change.type === "removed" || change.type === "deletion") {
            lines.push("- " + change.content);
          } else if (change.type === "modified") {
            lines.push("- " + change.oldContent);
            lines.push("+ " + change.newContent);
          }
        }
      }

      if (context.length > 0) {
        lines.push(...context.slice(0, contextLines));
      }
    }

    return lines.join("\n");
  }

  _formatSideBySide(diffResult) {
    const left = [];
    const right = [];

    if (diffResult.diff && Array.isArray(diffResult.diff)) {
      for (const change of diffResult.diff) {
        if (change.type === "unchanged") {
          left.push("  " + change.content);
          right.push("  " + change.content);
        } else if (change.type === "added" || change.type === "addition") {
          left.push("");
          right.push("+ " + change.content);
        } else if (change.type === "removed" || change.type === "deletion") {
          left.push("- " + change.content);
          right.push("");
        } else if (change.type === "modified") {
          left.push("- " + change.oldContent);
          right.push("+ " + change.newContent);
        }
      }
    }

    const maxLen = Math.max(left.length, right.length);
    const lines = [];

    for (let i = 0; i < maxLen; i++) {
      const l = left[i] || "";
      const r = right[i] || "";
      lines.push(`${l.padEnd(50)} | ${r}`);
    }

    return lines.join("\n");
  }

  _formatHTML(diffResult) {
    let html = '<div class="diff">';

    if (diffResult.diff && Array.isArray(diffResult.diff)) {
      for (const change of diffResult.diff) {
        const escaped = (str) =>
          str
            ? str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
            : "";

        if (change.type === "unchanged") {
          html += `<div class="line unchanged"><span>${escaped(
            change.content
          )}</span></div>`;
        } else if (change.type === "added" || change.type === "addition") {
          html += `<div class="line added"><span>+ ${escaped(
            change.content
          )}</span></div>`;
        } else if (change.type === "removed" || change.type === "deletion") {
          html += `<div class="line removed"><span>- ${escaped(
            change.content
          )}</span></div>`;
        } else if (change.type === "modified") {
          html += `<div class="line removed"><span>- ${escaped(
            change.oldContent
          )}</span></div>`;
          html += `<div class="line added"><span>+ ${escaped(
            change.newContent
          )}</span></div>`;
        }
      }
    }

    html += "</div>";
    return html;
  }

  getStatistics() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      diffs: 0,
      additions: 0,
      deletions: 0,
      modifications: 0,
      failed: 0,
    };
  }

  dispose() {
    this.reset();
  }
}

module.exports = Differ;
