# NPM Publish Steps

Complete these steps to publish the snippet-deobfuscator package to npm:

## Step 1: Login to npm

```bash
npm login
```

Enter your credentials when prompted:
- Username
- Password
- Email (one-time password if 2FA enabled)

## Step 2: Navigate to Project Directory

```bash
cd snippet-deobfuscator
```

## Step 3: Publish to npm

For public access:

```bash
npm publish --access=public
```

For scoped package (if using organization):

```bash
npm publish
```

## Step 4: Verify Publication

Check that it was published successfully:

```bash
npm view snippet-deobfuscator
```

## Step 5: Test Installation

After publishing, verify it works:

```bash
# Global install
npm install -g snippet-deobfuscator

# Or local install
npm install snippet-deobfuscator
```

## Usage After Install

```bash
# CLI usage
deobfuscate input.js -o output.js

# Or use the CLI directly
node cli.js input.js -o output.js
```

## Notes

- The package name in package.json is `snippet-deobfuscator`
- Make sure the name is unique on npm if you get a 403 error
- If you need to update the version, edit package.json first, then run `npm publish` again

## Troubleshooting

If you get permission errors:
1. Check if you're logged in: `npm whoami`
2. If not logged in: `npm login`
3. If package name exists, rename it in package.json

For 2FA accounts:
- You may need to use a one-time password
- Or generate a token from npmjs.com
