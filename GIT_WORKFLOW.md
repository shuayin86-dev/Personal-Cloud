# CloudSpace Git Workflow Guide

## Auto-Push Changes to GitHub

To maintain a clean git history and ensure all work is backed up to GitHub, use the following workflow:

### Quick Push (Automatic commit message)
```bash
./git-push.sh
```

This will:
1. ✅ Check for changes
2. 📝 Stage all changes automatically
3. 💾 Create a commit with default message
4. 📤 Push to GitHub main branch

### Custom Commit Message
```bash
./git-push.sh "feat: Add new feature description"
```

Examples:
```bash
./git-push.sh "feat: Add real-time notifications"
./git-push.sh "fix: Resolve chat display issue"
./git-push.sh "chore: Update dependencies"
./git-push.sh "docs: Update README"
```

## Commit Message Format

We follow Conventional Commits format for clarity:

- `feat:` New features
- `fix:` Bug fixes
- `chore:` Maintenance tasks
- `docs:` Documentation
- `refactor:` Code restructuring
- `style:` Code style changes
- `perf:` Performance improvements
- `test:` Test additions/updates

### Example
```bash
./git-push.sh "feat: Add @mention system with notifications"
```

## Git Configuration

Git is automatically configured with:
- Email: `copilot@github.com`
- Name: `GitHub Copilot`

To change this, run:
```bash
git config user.email "your@email.com"
git config user.name "Your Name"
```

## Manual Git Operations

If you prefer manual git operations:

```bash
# Stage all changes
git add -A

# Commit with message
git commit -m "your commit message"

# Push to GitHub
git push origin main

# Check status
git status

# View log
git log --oneline -5
```

## Tips

1. **Commit Often**: Make small, focused commits for easier debugging
2. **Clear Messages**: Write descriptive commit messages
3. **Before Starting**: Always pull latest changes
   ```bash
   git pull origin main
   ```
4. **View Changes**: Before pushing, check what's changed
   ```bash
   git diff
   git status
   ```

## GitHub Integration

All commits automatically:
- ✅ Appear in GitHub repository
- ✅ Update the main branch
- ✅ Trigger any GitHub Actions/Workflows
- ✅ Create backup of all work

## Troubleshooting

### Remote rejected
If push is rejected, pull first:
```bash
git pull origin main
git push origin main
```

### Uncommitted changes
View what's changed:
```bash
git status
git diff
```

### Want to undo last commit (before push)
```bash
git reset --soft HEAD~1
```

## Branch Strategy

- **main**: Production-ready code
- All commits go directly to main
- Tags created for releases

For more help:
```bash
git --help
```
