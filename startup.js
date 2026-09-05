// Funciones para colores y efectos básicos ANSI
const reset = '\x1b[0m';
const bright = '\x1b[1m';
const dim = '\x1b[2m';
const underscore = '\x1b[4m';
const blink = '\x1b[5m';
const reverse = '\x1b[7m';
const hidden = '\x1b[8m';

const fgRed = '\x1b[31m';
const fgGreen = '\x1b[32m';
const fgYellow = '\x1b[33m';
const fgBlue = '\x1b[34m';
const fgMagenta = '\x1b[35m';
const fgCyan = '\x1b[36m';
const fgWhite = '\x1b[37m';

console.log(' ');
console.log(' ');
console.log(' ');
console.log(`${bright}${fgYellow}***********************************************${reset}`);
console.log(`${bright}${fgCyan}           🚀 Welcome to HidenCloud 🚀         ${reset}`);
console.log(`${bright}${fgYellow}***********************************************${reset}\n`);
console.log(' ');
console.log(' ');
console.log('\x1b[36m%s\x1b[0m', 'ESPAÑOL: Bienvenido a HidenCloud, primero debes de seleccionar el tipo de servidor que deseas, para ello dirígete a Server Type.');
console.log(' ');
console.log('\x1b[32m%s\x1b[0m', 'ENGLISH: Welcome to HidenCloud. First, you must select the type of server you want; to do this, go to Server Type.');
console.log(' ');
console.log(' ');
console.log(`${bright}${fgYellow}***********************************************${reset}\n\n`);
console.log(' ');
console.log(' ');
console.log(' ');

setTimeout(() => process.exit(0), 30000);
