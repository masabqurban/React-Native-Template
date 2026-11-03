# Contributing

Thanks for helping improve this template.

## Development workflow

1. Fork the repository and create a branch from `main`, e.g. `feat/notifications`.
2. Install dependencies with `npm install`. A Husky pre-commit hook will lint and format the files you stage.
3. Make your change, then run:

   ```bash
   npm run check     # lint, type check, tests, formatting
   npm run doctor    # dependency and config health
   ```

4. Test on iOS **and** Android where possible, then open a pull request using the template.

## Conventions

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Install native packages with `npx expo install`**, never plain `npm install`: it picks versions compatible with the Expo SDK. npm 11 ignores `--dev`, so move test and lint tools to `devDependencies` by hand.
- **Routes stay thin** and contain nothing but route files. Every file in `src/app` becomes a route, so tests and helpers live elsewhere.
- **Architecture:** `app → features → shared`. Import features only through `@/features/<name>`.
- **Validate at the boundary.** Every API response goes through a Zod schema, and every form uses one.
- **Accessibility is part of done:** a role, label and state on every control, 44pt targets, and tests that query by role and label.
- **Cross-platform dialogs:** use `confirm()` and `notify()` from `@/lib/dialogs`. `Alert.alert` does nothing on web.
- **Style with tokens** from `@/theme`, never raw hex values.
