import chalk from "chalk";

/**
 *
 * @param {string} string
 * @param {'info' | 'err' | 'warn' | 'done' | undefined} style
 */
const log = (string, style) => {
  const date = new Date();

  const [hour, minutes, seconds] = [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ];

  switch (style) {
    case "info": {
      console.log(
        chalk.blue(`[INFO] ${hour}:${minutes}:${seconds} • ${string}`)
      );

      break;
    }

    case "err": {
      console.error(
        chalk.red(`[ERROR] ${hour}:${minutes}:${seconds} • ${string}`)
      );

      break;
    }

    case "warn": {
      console.warn(
        chalk.yellow(`[WARNING] ${hour}:${minutes}:${seconds} • ${string}`)
      );

      break;
    }

    case "done": {
      console.log(
        chalk.green(`[SUCCESS] ${hour}:${minutes}:${seconds} • ${string}`)
      );

      break;
    }

    default: {
      console.log(`${hour}:${minutes}:${seconds} • ${string}`);
      break;
    }
  }
};

/**
 *
 * @param {number} time
 * @param {import('discord.js').TimestampStylesString} style
 * @returns {`<t:${string}>`}
 */
const time = (time, style) => {
  return `<t:${Math.floor(time / 1000)}${style ? `:${style}` : ""}>`;
};

export { log, time };
