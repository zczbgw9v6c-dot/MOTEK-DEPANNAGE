import { defineConfig } from "vite";
import { autohubAPI } from "./server/plugin";
export default defineConfig({
  // AUTOHUB_DB permet d’isoler une base (tests UI) sans toucher aux dossiers réels.
  plugins: [autohubAPI(process.env.AUTOHUB_DB || undefined)],
  build: {
    rollupOptions: {
      // Deux entrées : l’application historique (index.html) et MOTEK v3 (motek/).
      input: { main: "index.html", motek: "motek/index.html" },
      output: {
        manualChunks: {
          three: ["three", "three/addons/controls/OrbitControls.js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
