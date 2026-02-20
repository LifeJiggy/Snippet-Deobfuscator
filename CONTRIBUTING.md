# Contributing to JS Snippet Deobfuscator

Thank you for your interest in contributing! This project welcomes contributions from the community.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Welcome newcomers and help them get started

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a detailed issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Sample obfuscated code (if possible)
   - Environment details

### Suggesting Features

1. Open an issue with `[Feature Request]` prefix
2. Describe the feature use case
3. Explain how it should work
4. Provide examples if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit with clear messages: `git commit -m 'Add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/snippet-deobfuscator.git

# Install dependencies
npm install

# Run tests
npm test

# Run with sample code
node index.js sample.js
```

## Coding Standards

### JavaScript Style

- Use ES6+ features
- Use `const` and `let` - never `var`
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Maximum line length: 100 characters

### File Organization

- One export per file preferred
- Use modules for code organization
- Group related functionality

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Log errors appropriately

### Testing

- Write unit tests for new features
- Test edge cases
- Ensure backward compatibility

## Adding New Obfuscation Patterns

To add support for a new obfuscation type:

1. Add detection logic in `patterns.js`
2. Add decoding logic in appropriate module
3. Add tests in `test.js`
4. Update README.md with new supported types

## Adding New Framework Support

1. Add framework patterns in `patterns.js`
2. Add framework-specific renaming in `renamer.js`
3. Test with real framework code
4. Update documentation

## Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

## Recognition

Contributors will be recognized in the README.md

## Questions?

Open an issue or start a discussion
