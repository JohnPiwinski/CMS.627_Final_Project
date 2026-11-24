import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

import { chapterScripts } from './src/content';

const chapterFiles = chapterScripts.map(file => fileURLToPath(new URL(file, import.meta.url)));
const generator = fileURLToPath(new URL('./scripts/narration.mjs', import.meta.url));

export default defineConfig({
  resolve: { dedupe: ['three'] },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), fileURLToPath(new URL('../interactive-artin-ch0', import.meta.url))],
    },
  },
  plugins: [{
    name: 'chapter-narration',
    configureServer(server) {
      let running = false;
      let pending = false;
      let closed = false;
      function generate() {
        if (closed) return;
        if (running) { pending = true; return; }
        running = true;
        const processHandle = spawn(process.execPath, [generator], { stdio: 'inherit' });
        processHandle.on('error', error => server.config.logger.error(error.message));
        processHandle.on('close', code => {
          running = false;
          if (code !== 0) server.config.logger.error('Chapter narration generation failed. See the generator output.');
          if (pending) { pending = false; generate(); }
        });
      }
      server.watcher.on('change', file => { if (chapterFiles.includes(file)) generate(); });
      server.httpServer?.once('close', () => { closed = true; });
    },
  }],
});
