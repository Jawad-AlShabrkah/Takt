# Contributing to Takt

Thank you for your interest in contributing to Takt! This guide will help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Follow the Quick Start guide** in [QUICK_START.md](./QUICK_START.md)

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-export-functionality`
- `fix/drag-drop-collision`
- `docs/update-deployment-guide`

### 2. Make Your Changes

Follow these guidelines:

- **Write clean, readable code** with meaningful variable names
- **Add comments** for complex logic
- **Follow the existing code style** (TypeScript, React patterns)
- **Keep commits atomic** - one feature per commit
- **Write descriptive commit messages**

### 3. Test Your Changes

```bash
# Type check
pnpm check

# Run tests
pnpm test

# Test locally
pnpm dev
```

### 4. Update Documentation

- Update `README.md` if adding new features
- Update `ARCHITECTURE.md` if changing system design
- Update `todo.md` to mark completed items

### 5. Submit a Pull Request

- Provide a clear description of changes
- Reference any related issues
- Ensure all tests pass
- Request review from maintainers

## Code Style Guidelines

### TypeScript

- Use strict mode (enabled by default)
- Define types explicitly
- Avoid `any` type
- Use meaningful names

```typescript
// ✅ Good
interface Product {
  id: number;
  sdNumber: string;
  status: 'blue' | 'yellow' | 'green';
}

// ❌ Avoid
const product: any = { ... };
```

### React Components

- Use functional components
- Keep components focused and reusable
- Use hooks for state management
- Add PropTypes or TypeScript interfaces

```typescript
// ✅ Good
interface ProductCardProps {
  product: Product;
  onMove: (newPosition: Position) => void;
}

export function ProductCard({ product, onMove }: ProductCardProps) {
  // Component logic
}

// ❌ Avoid
export function ProductCard(props) {
  // Component logic
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Avoid inline styles
- Use design tokens from `index.css`
- Keep responsive design in mind

```typescript
// ✅ Good
<div className="bg-card text-card-foreground rounded-lg shadow-md p-4">

// ❌ Avoid
<div style={{ backgroundColor: '#fff', padding: '16px' }}>
```

### Database Changes

- Update `drizzle/schema.ts` first
- Generate migration: `pnpm drizzle-kit generate`
- Review generated SQL
- Test migration locally
- Document schema changes

## Testing

### Writing Tests

- Test critical paths and edge cases
- Use descriptive test names
- Mock external dependencies
- Keep tests focused and isolated

```typescript
// ✅ Good
it('should move product to new area when valid position provided', async () => {
  const result = await moveProduct(productId, newAreaId, position);
  expect(result.success).toBe(true);
  expect(result.product.currentAreaId).toBe(newAreaId);
});

// ❌ Avoid
it('works', async () => {
  const result = await moveProduct(1, 2, { x: 10, y: 20 });
  expect(result).toBeDefined();
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/routers.test.ts

# Run with coverage
pnpm test --coverage
```

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, missing semicolons)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Build, dependencies, tooling

Examples:
```
feat(products): add bulk import functionality
fix(drag-drop): resolve collision detection bug
docs(deployment): update Vercel setup guide
test(areas): add tests for area capacity validation
```

## Pull Request Process

1. **Update your branch** with latest main
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Ensure all tests pass**
   ```bash
   pnpm check && pnpm test
   ```

3. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request** on GitHub
   - Provide clear title and description
   - Link related issues
   - Add screenshots for UI changes

5. **Address review feedback**
   - Make requested changes
   - Push updates (no force push)
   - Re-request review

## Documentation Standards

### Code Comments

```typescript
// ✅ Good - explains why, not what
// We use a Set to avoid duplicate product IDs in the movement history
const uniqueProductIds = new Set(movements.map(m => m.productId));

// ❌ Avoid - obvious from code
// Get unique product IDs
const uniqueProductIds = new Set(movements.map(m => m.productId));
```

### Function Documentation

```typescript
/**
 * Move a product to a new area and position.
 * 
 * @param productId - The ID of the product to move
 * @param newAreaId - The ID of the destination area
 * @param position - The new position within the area
 * @returns The updated product with movement history
 * @throws Error if product or area not found
 */
export async function moveProduct(
  productId: number,
  newAreaId: number,
  position: Position
): Promise<Product> {
  // Implementation
}
```

## Reporting Issues

When reporting bugs:

1. **Search existing issues** first
2. **Provide clear description** of the problem
3. **Include steps to reproduce**
4. **Attach screenshots/logs** if relevant
5. **Specify environment** (OS, browser, Node version)

### Bug Report Template

```markdown
## Description
Brief description of the issue

## Steps to Reproduce
1. Click on...
2. Then...
3. Expected behavior...
4. Actual behavior...

## Environment
- OS: macOS/Windows/Linux
- Browser: Chrome/Firefox/Safari
- Node version: 22.x
- Database: MySQL/Turso

## Logs/Screenshots
[Attach relevant logs or screenshots]
```

## Feature Requests

When suggesting new features:

1. **Describe the use case** - Why is this needed?
2. **Provide examples** - How would it work?
3. **Consider impact** - Does it affect other features?
4. **Suggest implementation** - If you have ideas

### Feature Request Template

```markdown
## Description
What feature would you like to add?

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternative Solutions
Are there other approaches?

## Additional Context
Any other relevant information?
```

## Performance Considerations

When contributing:

- **Minimize database queries** - Use joins and batch operations
- **Optimize rendering** - Avoid unnecessary re-renders
- **Cache appropriately** - Use React Query for data fetching
- **Monitor bundle size** - Keep dependencies minimal
- **Test with large datasets** - Ensure scalability

## Security Best Practices

- **Never hardcode secrets** - Use environment variables
- **Validate user input** - Use Zod for schema validation
- **Sanitize output** - Prevent XSS attacks
- **Check permissions** - Verify user authorization
- **Use HTTPS** - Enforce secure connections
- **Keep dependencies updated** - Run `pnpm outdated`

## Getting Help

- **Documentation**: Read README.md, ARCHITECTURE.md, DEPLOYMENT.md
- **Issues**: Check GitHub issues for similar problems
- **Discussions**: Start a discussion for questions
- **Code Review**: Ask maintainers for guidance

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Welcome diverse perspectives
- Report inappropriate behavior

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project README

Thank you for contributing to Takt! 🙏
