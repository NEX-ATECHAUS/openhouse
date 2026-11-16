import next from "eslint-config-next";

const config = [
  { ignores: [".next/**", "node_modules/**", "visual-report/**", "next-env.d.ts"] },
  ...next,
];

export default config;
