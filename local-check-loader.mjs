// Test-only ESM resolution helper for running local-check-*.mjs scripts
// directly with plain Node. Vite resolves extensionless relative imports
// (e.g. `import x from './activityLog'`) automatically at dev/build time;
// plain Node's ESM loader does not. This hook only adds a `.js` fallback
// when the default resolution fails for a relative specifier — it does not
// change any source file and has no effect outside these test scripts.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
      return nextResolve(`${specifier}.js`, context)
    }
    throw err
  }
}
