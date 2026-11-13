
import { defineConfig } from "tsup";


export default defineConfig({
    entry: ["src2/index.tsx"],
    dts: true, // generate .d.ts
    injectStyle: true, // no css file
    clean: true, // clean `dist` before building
    sourcemap: false, // sourcemaps apparently allow easier debugging
    // splitting: true,
    external: ['react', 'react-dom'],

    // format: ['esm', 'cjs'],
    // legacyOutput: true,
});

