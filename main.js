const fs = require('fs');
const { Command } = require('commander');
const program = new Command();

program.configureOutput({
  writeOut: () => {},
  writeErr: () => {}
});

program
  .option('-i, --input <file>', 'input file')
  .option('-o, --output <file>', 'output file')
  .option('-d, --display', 'display output to console')
  .option(
    '-a, --airtime <number>',
    'show only flights with AIR_TIME longer than value',
    parseFloat
  )
  .option('-t, --date', 'show FL_DATE before AIR_TIME and DISTANCE');

program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
}

const opts = program.opts();

if (!opts.input) {
  console.error('Please, specify input file');
  process.exit(1);
}

if (process.argv.includes('-o') && !opts.output) {
  console.error('Please, specify output file path');
  process.exit(1);
}

if (process.argv.includes('-a') && (opts.airtime === undefined || Number.isNaN(opts.airtime))) {
  console.error('Please, specify airtime value');
  process.exit(1);
}

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

if (opts.airtime && !Number.isNaN(opts.airtime)) {
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