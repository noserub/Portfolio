
  import { defineConfig, loadEnv } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { canonicalProjectSlug, slugFromProjectTitle, TSLIM_PROJECT_SLUG } from './src/lib/projectSlug';

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    return {
      plugins: [
        react(),
        {
          name: 'exclude-unreviewed-tslim-snapshot',
          apply: 'build',
          enforce: 'pre',
          transform(source, id) {
            if (id !== path.resolve(__dirname, 'src/data/publishedSnapshot.json')) return;
            const snapshot = JSON.parse(source);
            const projectSlug = (row: { title: string }) => slugFromProjectTitle(row.title);
            const projects = snapshot.projects as { title: string; published: boolean; requires_password: boolean }[];
            const tslim = projects.find((row) => projectSlug(row) === TSLIM_PROJECT_SLUG) ??
              projects.find((row) => canonicalProjectSlug(projectSlug(row)) === TSLIM_PROJECT_SLUG);
            const includeTslim = env.VITE_FORCE_PUBLISHED_SNAPSHOT === 'true' &&
              tslim?.published === true && tslim.requires_password === false;
            snapshot.projects = projects.filter((row) =>
              canonicalProjectSlug(projectSlug(row)) !== TSLIM_PROJECT_SLUG || (row === tslim && includeTslim));
            return JSON.stringify(snapshot);
          },
        },
      ],
      resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['react', 'react-dom']
      },
      build: {
        target: 'esnext',
        outDir: 'dist',
        chunkSizeWarningLimit: 1500,
      },
      server: {
        port: 3000,
        open: true,
      },
    };
  });
