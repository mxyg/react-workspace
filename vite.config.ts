import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        antd: resolve(__dirname, 'src/integrations/antd.ts'),
      },
      name: 'ReactWorkspace',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        entryName === 'index'
          ? `react-workspace.${format === 'es' ? 'js' : 'cjs'}`
          : `react-workspace-${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
      ],
      output: {
        assetFileNames: 'react-workspace.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
