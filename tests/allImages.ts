import { StrategiesType, fixImage } from "../src";
import { loadPng, savePng } from "./testUtils";
import fs from "fs";

// Iterate over all assets for a given strategy
const generateAllImagesForStrategy = (
  outPixWidth: number,
  outPixHeight: number,
  strategy: StrategiesType
) => {
  const assetsData = fs.readdirSync("./assets");
  const files = fs.readdirSync(".");

  if (!files.includes("out")) {
    fs.mkdirSync("./out");
  }
  assetsData.forEach((fileName) => {
    const png = loadPng(fileName);

    const fixedImage = fixImage(png, { outPixWidth, outPixHeight, strategy });

    savePng(
      fixedImage,
      `./out/${fileName.split("/").at(-1)!.split(".png").at(-2)!}-out.png`
    );
  });
};

let args = process.argv.slice(2);

console.log("args passed:", args);

generateAllImagesForStrategy(
  Number(args[1]),
  Number(args[2]),
  args[0] as StrategiesType
);
