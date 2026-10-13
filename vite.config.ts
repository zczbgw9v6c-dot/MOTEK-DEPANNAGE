import { defineConfig } from "vite";
import { autohubAPI } from "./server/plugin";
export default defineConfig({
  plugins: [autohubAPI()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/addons/controls/OrbitControls.js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
