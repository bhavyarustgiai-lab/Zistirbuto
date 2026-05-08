import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        return [key, value];
      }),
  );
}

const envFile = loadDotEnv(path.resolve(__dirname, ".env"));
const viteEnv = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith("VITE_")),
  ),
  ...envFile,
};

const defineEnv = Object.fromEntries(
  Object.entries(viteEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
);

export default defineConfig({
  context: __dirname,
  entry: "./src/main.tsx",
  output: {
    publicPath: "/",
  },
  experiments: { css: true },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@features": path.resolve(__dirname, "src/features"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@components": path.resolve(__dirname, "src/components")
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: { syntax: "typescript", tsx: true },
                transform: { react: { runtime: "automatic" } }
              }
            }
          }
        ],
        type: "javascript/auto"
      },
      {
        test: /\.css$/,
        type: "css",
        use: ["postcss-loader"]
      }
    ]
  },
  plugins: [
    new rspack.DefinePlugin({
      "import.meta.env": JSON.stringify(viteEnv),
      ...defineEnv,
    }),
    new rspack.HtmlRspackPlugin({ template: "./index.html" }),
  ],
  devServer: {
    port: 3000,
    historyApiFallback: true
  }
});
