// Named import: Vite includes only the version string in the bundle, not the whole package.json.
import { version } from '../../package.json';

export const APP_VERSION = version || '2.0.0';
export const APP_VERSION_LABEL = `v${APP_VERSION} — Enterprise Web`;
export const APP_VERSION_FULL_LABEL = `v${APP_VERSION} — Enterprise Web Edition`;
