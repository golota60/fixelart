import { Strategies, fixImage } from "../src";
import { loadPng, savePng } from "./testUtils";
import fs from "fs";

// Iterate all strategires for an image
const generateAllStrategiesForImage = (
  outPixWidth: number,
  outPixHeight: number,
  path: string
) => {
  Object.values(Strategies).forEach((strategy) => {
    const png = loadPng(path);
    const files = fs.readdirSync(".");

    if (!files.includes("out")) {
      fs.mkdirSync("./out");
    }

    const fixedImage = fixImage(png, {
      outPixWidth,
      outPixHeight,
      strategy,
    });

    savePng(
      fixedImage,
      `./out/${path.split("/").at(-1)!.split(".png").at(-2)!}-${strategy}.png`
    );
  });
};

let args = process.argv.slice(2);

console.log("args passed:", args);

generateAllStrategiesForImage(Number(args[1]), Number(args[2]), args[0]);
