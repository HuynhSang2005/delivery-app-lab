# Task Completion Checklist

When completing a task, follow this checklist:

## Before Committing
1. [ ] Code compiles/builds without errors
2. [ ] Linting passes: `bun run lint`
3. [ ] Tests pass: `bun run test`
4. [ ] Format code: `bun run format` (if available)

## Code Quality
- [ ] TypeScript types properly defined
- [ ] No `any` types without justification
- [ ] Error handling implemented
- [ ] Console logs removed (unless debug mode)

## Documentation
- [ ] Update README if adding new features
- [ ] Add JSDoc comments for public APIs
- [ ] Update SDD if architecture changes

## Git
- [ ] Meaningful commit messages
- [ ] Atomic commits (one feature/fix per commit)
- [ ] Branch naming: feature/*, fix/*, chore/*
