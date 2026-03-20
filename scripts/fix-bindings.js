// Workaround for npm optional dependencies bug on Node 24+
// https://github.com/npm/cli/issues/4828
// Installs platform-specific native bindings that npm fails to resolve.

import { execSync } from 'child_process';
import { platform, arch } from 'os';

const bindings = {
  'win32-x64': [
    '@rollup/rollup-win32-x64-msvc',
    '@tailwindcss/oxide-win32-x64-msvc',
    'lightningcss-win32-x64-msvc',
  ],
  'linux-x64': [
    '@rollup/rollup-linux-x64-gnu',
    '@tailwindcss/oxide-linux-x64-gnu',
    'lightningcss-linux-x64-gnu',
  ],
  'darwin-x64': [
    '@rollup/rollup-darwin-x64',
    '@tailwindcss/oxide-darwin-x64',
    'lightningcss-darwin-x64',
  ],
  'darwin-arm64': [
    '@rollup/rollup-darwin-arm64',
    '@tailwindcss/oxide-darwin-arm64',
    'lightningcss-darwin-arm64',
  ],
};

const key = `${platform()}-${arch()}`;
const packages = bindings[key];

if (packages) {
  console.log(`Installing native bindings for ${key}...`);
  try {
    execSync(`npm install ${packages.join(' ')} --no-save`, { stdio: 'inherit' });
  } catch {
    console.warn('Warning: Could not install some native bindings. Build may still work.');
  }
} else {
  console.log(`No native binding overrides needed for ${key}`);
}
