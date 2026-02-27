const tsConfigPaths = require('tsconfig-paths');
const { paths, baseUrl } = require('./tsconfig.json').compilerOptions;

tsConfigPaths.register({
  baseUrl: './',
  paths,
});
