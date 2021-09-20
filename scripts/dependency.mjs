import fs from "fs";
const isReset = process.argv.includes("--reset");
const temp = "temp.json";
const packageJson = "package.json";
if (isReset) {
  const backup = JSON.parse(fs.readFileSync(temp).toString("utf-8"));
  fs.rmSync(temp);
  fs.writeFileSync(packageJson, JSON.stringify(backup, undefined, 2) + "\n");
} else {
  const json = JSON.parse(fs.readFileSync(packageJson).toString("utf-8"));
  fs.writeFileSync(temp, JSON.stringify(json));
  delete json.scripts;
  delete json.devDependencies;
  fs.writeFileSync(packageJson, JSON.stringify(json, undefined, 2) + "\n");
}
