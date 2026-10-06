export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{json,md,css,yaml,yml,html}': ['prettier --write'],
};
