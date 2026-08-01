// `server-only` exists to blow up if a server module is pulled into a client
// bundle. Under vitest there is no bundle and no client, so importing it for
// real would fail every suite that touches lib/settings.ts and friends.
// vitest.config.ts aliases the package to this no-op instead.
export {};
