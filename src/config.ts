import { Config, typedQuestion } from "./types";

const config: Config = {
  questions: [
    typedQuestion({
      type: "single-select",
      name: "chain-type",
      message: "What chain do you want to use?",
      extensions: ["scaffold-stark"],
      default: "scaffold-stark",
    }),
  ],
};
export default config;
