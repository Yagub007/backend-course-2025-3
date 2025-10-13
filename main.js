import { Command } from "commander";
import fs from "fs";

function silentCommanderErrors(fn) {
  const originalStderrWrite = process.stderr.write;
  process.stderr.write = () => {}; 
  try {
    fn();
  } finally {
    process.stderr.write = originalStderrWrite; 
  }
}

const program = new Command();

program.exitOverride();

let parseError = null;

silentCommanderErrors(() => {
  try {
    program
      .option("-i, --input <path>", "input JSON file (required)")
      .option("-o, --output <path>", "output file")
      .option("-d, --display", "display output to console")
      .option("-a, --airtime <number>", "show only flights with AIR_TIME longer than value", parseFloat)
      .option("-t, --date", "show FL_DATE before AIR_TIME and DISTANCE");

    program.parse(process.argv);
  } catch (err) {
    parseError = err;
  }
});

if (parseError) {
  if (parseError.code === "commander.missingArgument" || parseError.code === "commander.optionMissingArgument") {
    if (parseError.message.includes("--input") || parseError.message.includes("-i")) {
      console.error("Please, specify input file");
    } else if (parseError.message.includes("--output") || parseError.message.includes("-o")) {
      console.error("Please, specify output file path");
    } else if (parseError.message.includes("--airtime") || parseError.message.includes("-a")) {
      console.error("Please, specify airtime value");
    } else {
      console.error("Missing argument for option");
    }
    process.exit(1);
  }

  process.exit(1);
}

const options = program.opts();

if (!options.input) {
  console.error("Please, specify input file");
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(options.input, "utf-8"));
let result = data;

if (options.airtime) {
  result = result.filter((item) => item.AIR_TIME && item.AIR_TIME > options.airtime);
}

let outputText = result
  .map((item) => {
    const datePart = options.date ? `${item.FL_DATE} ` : "";
    return `${datePart}${item.AIR_TIME} ${item.DISTANCE}`;
  })
  .join("\n");

if (options.output) {
  fs.writeFileSync(options.output, outputText);
}

if (options.display) {
  console.log(outputText);
}
