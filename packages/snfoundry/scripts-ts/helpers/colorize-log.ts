const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const colorize = (color: string, message: string): string => {
  return `${color}${message}${colors.reset}`;
};

export const red = (message: string): string => colorize(colors.red, message);
export const green = (message: string): string =>
  colorize(colors.green, message);
export const yellow = (message: string): string =>
  colorize(colors.yellow, message);
export const blue = (message: string): string => colorize(colors.blue, message);
export const cyan = (message: string): string => colorize(colors.cyan, message);
