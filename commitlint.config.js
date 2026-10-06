export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'repo',
        'deps',
        'config',
        'docs',
        'ci',
        'shell',
        'catalogo',
        'filme',
        'minha-area',
        'contracts',
        'tmdb',
        'user-data',
        'ui',
      ],
    ],
    'subject-case': [0],
  },
};
