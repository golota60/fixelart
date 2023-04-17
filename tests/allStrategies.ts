import { Strategies, fixImage, loadPng, savePng } from "../src";

// Iterate all strategires for an image
const generateAllStrategiesForImage = (
  outPixWidth: number,
  outPixHeight: number,
  path: string
) => {
  Object.values(Strategies).forEach((strategy) => {
    const png = loadPng(path);

    const fixedImage = fixImage(png, { outPixWidth, outPixHeight, strategy });

    savePng(fixedImage, `${path.split(".png").at(-2)!}-${strategy}.png`);
  });
};

let args = process.argv.slice(2);

console.log("args passed:", args);

generateAllStrategiesForImage(Number(args[1]), Number(args[2]), args[0]);
