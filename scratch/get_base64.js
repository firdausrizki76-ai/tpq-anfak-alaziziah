const fs = require('fs');
const path = 'e:/Kerjaan Abi/Aplikasi Absen TPQ/frontend/public/assets/qiraati.jpg';
const data = fs.readFileSync(path);
console.log(data.toString('base64'));
