import { Config, typedQuestion } from "./types";

const config: Config = {
  questions: [
    typedQuestion({
      type: "single-select",
      name: "chain-type",
      message: "What framework do you want to use?",
      extensions: ["starknet-native"],
      default: "starknet-native",
    }),
  ],
};
export default config;
