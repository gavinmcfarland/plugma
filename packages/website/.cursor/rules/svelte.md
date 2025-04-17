# Svelte Rules

## Runes Mode

- Replace `export let` declarations with `$props()`
- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$effect()` for side effects

## Component Structure

- Keep components focused and single-purpose
- Use TypeScript for type safety
- Follow Svelte's naming conventions (PascalCase for components)

## Props

- Use `$props()` for component props
- Define prop types using TypeScript interfaces
- Document props with JSDoc comments

## State Management

- Prefer local state over global state when possible
- Use stores for global state management
- Keep state updates predictable and traceable

## Styling

- Use scoped styles with `<style>` blocks
- Follow CSS naming conventions
- Keep styles modular and maintainable
