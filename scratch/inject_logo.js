const fs = require('fs');
const path = require('path');

// Run from project root
const b64Path = path.join(process.cwd(), 'scratch', 'qiraati_base64.txt');
const jsxPath = path.join(process.cwd(), 'frontend', 'src', 'pages', 'ujian', 'UjianPage.jsx');

const b64 = fs.readFileSync(b64Path, 'utf8').trim();
let content = fs.readFileSync(jsxPath, 'utf8');

const startMarker = '<img src="data:image/jpeg;base64,';
const endMarker = '" alt="Qiraati"';

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.error('Start marker not found');
    process.exit(1);
}

const markerEndIndex = startIndex + startMarker.length;
const endIndex = content.indexOf(endMarker, markerEndIndex);

if (endIndex === -1) {
    console.error('End marker not found');
    process.exit(1);
}

const newContent = content.substring(0, markerEndIndex) + b64 + content.substring(endIndex);
fs.writeFileSync(jsxPath, newContent);
console.log('Successfully updated Base64 in UjianPage.jsx');
