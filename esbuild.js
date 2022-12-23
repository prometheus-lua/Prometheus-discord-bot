const { nodeExternalsPlugin } = require('esbuild-node-externals');

require('esbuild').build({
  entryPoints: ['./src/index.ts'],
  sourceRoot: './src',
  bundle: true,
  outfile: 'index.js',
  minify: true,
  plugins: [nodeExternalsPlugin()],
  external: ['fs', 'child_process']
}).catch(() => process.exit(1));
