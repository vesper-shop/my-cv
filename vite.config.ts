import tailwindcss from "@tailwindcss/vite";
import { voidReact } from "@void/react/plugin";
import { voidPlugin } from "void";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [voidPlugin(), voidReact({ react: { compiler: true } }), tailwindcss()],
  lint: {
    ignorePatterns: ["dist/**", "void.lock.json"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    indent: "tab",
    ignorePatterns: ["dist/**", "void.lock.json"],
  },
});
