# Save your snippet to a file

echo "function qt(e, t, n, r) { var o = bt, a = \$t.transition; \$t.transition = null; try { bt = 1, Yt(e, t, n, r) } finally { bt = o, \$t.transition = a } }" > snippet.js

# Deobfuscate it

node index.js snippet.js

# Or pipe directly

echo "function Kr(e) { return ('string' == typeof e ? e : '' + e).replace(Qr, '\n').replace(Gr, '') }" | node index.js -

222222

\JS-Obfuscated>node deobfuscate_tool.js snippet.js
np