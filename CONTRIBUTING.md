# Contributing to B2B Product Scraper

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Code of Conduct

- Be respectful and constructive
- Help others learn and grow
- Report issues clearly and provide context

## How to Contribute

### 🐛 Report Bugs

1. Check if issue already exists
2. Create new issue with:
   - Clear title
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (Node version, OS, etc.)

### 🚀 Suggest Features

1. Check discussions for similar ideas
2. Open a discussion with:
   - Clear use case
   - Why it would be useful
   - Any implementation ideas

### 📝 Submit Code

1. **Fork** the repository
2. **Create branch**: `git checkout -b feature/my-feature`
3. **Make changes** with clear commits
4. **Test**: `npm test`
5. **Build**: `npm run build`
6. **Format**: `npm run format`
7. **Submit PR** with description

### 📚 Improve Documentation

- README improvements
- New guides in `/docs`
- Better error messages
- Inline code comments

## Development Setup

```bash
# Clone fork
git clone https://github.com/YOUR_USERNAME/b2b-product-scraper.git
cd b2b-product-scraper

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/my-feature

# Make changes
npm run dev

# Run tests
npm test

# Format code
npm run format

# Check types
npm run type-check

# Push and create PR
git push origin feature/my-feature
```

## Code Standards

### TypeScript

- Use strict mode
- Define types explicitly
- Avoid `any` type
- Use interfaces for objects

### Testing

- Write tests for new features
- Aim for >80% coverage
- Use descriptive test names
- Test error cases too

### Documentation

- Update README for new features
- Add JSDoc comments to functions
- Include usage examples
- Document breaking changes

## Areas We Need Help With

- [ ] Add adapters for popular B2B platforms
- [ ] Improve price parser for more locales
- [ ] Add GraphQL API support
- [ ] Performance optimizations
- [ ] More comprehensive error handling
- [ ] CI/CD pipeline improvements
- [ ] Documentation translations

## Commit Message Convention

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc
refactor: code restructuring
test: adding or updating tests
chore: maintenance tasks
```

Example:
```
feat: add support for EUR currency format

- Parse Euro prices in format "€1.234,56"
- Update price-parser tests
- Add example to documentation

Closes #123
```

## Pull Request Process

1. Update changelog with your changes
2. Update docs if needed
3. Ensure tests pass
4. Request review from maintainers
5. Address feedback
6. Merge when approved

## Questions?

- Create a Discussion for questions
- Comment on relevant issues
- Start a conversation in Discussions tab

---

**Thank you for contributing!** 🙏
