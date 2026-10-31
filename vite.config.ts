import {defineConfig} from 'vite';
// Relative assets work on both username.github.io and /repository/ project URLs.
export default defineConfig({base:'./',build:{target:'es2022'}});
