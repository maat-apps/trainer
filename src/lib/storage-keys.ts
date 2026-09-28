// Every storage key the app owns is declared here — add new ones here so any
// future backup/reset logic (trainer#9) stays in step, same convention
// routines uses its own storage-keys.ts for.
export const DATA_KEY = "trainer-data";
export const SETTINGS_KEY = "trainer-settings";
export const SNAPSHOT_KEY = "trainer-update-snapshot";
