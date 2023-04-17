import { PNG, PNGWithMetadata } from "pngjs";
import fs from "fs";

/*
 * Loads a png using `pngjs`
 */
export const loadPng = (fileName: string): PNGWithMetadata => {
  const file = fs.readFileSync(fileName);

  const png = PNG.sync.read(file);
  return png;
};

/*
 * Saves a png using `pngjs`
 */
export const savePng = (png: PNGWithMetadata, pathToSave: string) => {
  let buff = PNG.sync.write(png);

  fs.writeFileSync(pathToSave, buff);
};
