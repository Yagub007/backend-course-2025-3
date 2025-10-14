const fs = require('fs');
const { Command } = require('commander');
const program = new Command();

program.configureOutput({
  writeErr: (str) => {
    str = str.trim();
    if (str.includes("option '-i, --input ")) {
      console.error('Please, specify input file');
    } else if (str.includes("option '-o, --output <path>' argument missing")) {
      console.error('Please, specify output file path');
    } else if (str.includes("option '-a, --airtime <number>' argument missing")) {
      console.error('Please, specify airtime value');
    } else {
      console.error(str);
    }
  },
});

program
  .requiredOption('-i, --input <path>', 'input JSON file (required)')
  .option('-o, --output <path>', 'output file')
  .option('-d, --display', 'display output to console')
  .option(
    '-a, --airtime <number>',
    'show only flights with AIR_TIME longer than value',
    parseFloat
  )
  .option('-t, --date', 'show FL_DATE before AIR_TIME and DISTANCE');

program.parse(process.argv);
const opts = program.opts();

if (!fs.existsSync(opts.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

const raw = fs.readFileSync(opts.input, 'utf8').trim();

let data;
try {
  data = JSON.parse(raw);
  if (!Array.isArray(data)) data = [data];
} catch {
  try {
    data = raw
      .split('\n')
      .filter(line => line.trim()) 
      .map(line => JSON.parse(line));
  } catch {
    console.error('Invalid JSON format in input file');
    process.exit(1);
  }
}

let result = data;

if (opts.airtime) {
  if (Number.isNaN(opts.airtime)) {
    console.error('Airtime must be a number');
    process.exit(1);
  }
  result = result.filter(item => item.AIR_TIME && item.AIR_TIME > opts.airtime);
}

let outputText = result
  .map(item => {
    const datePart = opts.date ? `${item.FL_DATE} ` : '';
    return `${datePart}${item.AIR_TIME} ${item.DISTANCE}`;
  })
  .join('\n');

if (opts.output) {
  fs.writeFileSync(opts.output, outputText, 'utf8');
}

if (opts.display) {
  console.log(outputText);
}
