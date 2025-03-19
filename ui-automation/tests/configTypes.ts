import { Browser, Page } from "playwright";

declare global {
  const page: Page;
  const browser: Browser;
  const browserName: string;
}

export default {
  BASE_URL: "http://localhost:3000",
};
