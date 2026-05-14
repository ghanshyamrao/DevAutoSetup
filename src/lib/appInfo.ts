import pkg from '../../package.json';

export const APP_NAME = 'DevOnboard';

export const APP_VERSION = pkg.version as string;

export const APP_TAGLINE = 'Developer environment setup';

export const APP_DESCRIPTION =
  pkg.description ||
  'A Windows desktop application that installs essential development software with a single click. Uses Windows Package Manager (winget) and a configurable software catalog (JSON).';

export const APP_AUTHOR = 'Ghanshyam Rao';

export const APP_AUTHOR_EMAIL = 'ghanshyamrao108@gmail.com';

export const APP_LICENSE = 'MIT';
