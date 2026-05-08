const fs = require('fs');
const path = require('path');

const jsxPath = path.join(process.cwd(), 'frontend', 'src', 'pages', 'ujian', 'UjianPage.jsx');
let content = fs.readFileSync(jsxPath, 'utf8');

// Target the print layout structure
// We want to wrap the header and data in a continuous border

const oldStart = '{printSantri && (';
const oldEnd = '<table className="ptable">';

// We find the index of the start of the card content
const startIndex = content.indexOf('<div className="a5-card">');
const contentStartIndex = startIndex + '<div className="a5-card">'.length;

// We find the index of the main data table
const dataTableIndex = content.indexOf('<table className="ptable">');

if (startIndex === -1 || dataTableIndex === -1) {
    console.error('Markers not found');
    process.exit(1);
}

// We will reconstruct the internal part of the a5-card
// to use a single border wrapper

// Extract the header part (which contains the Base64)
// We need to keep the image tag intact.
const headerPartStart = content.indexOf('<table style={{ width: \'100%\'', startIndex);
const headerPartEnd = content.indexOf('</table>', headerPartStart) + '</table>'.length;
const headerContent = content.substring(headerPartStart, headerPartEnd);

// Extract the title part
const titlePartStart = content.indexOf('<div style={{ textAlign: \'center\', marginBottom: \'8px\' }}', headerPartEnd);
const titlePartEnd = content.indexOf('</div>', titlePartStart) + '</div>'.length;
const titleContent = content.substring(titlePartStart, titlePartEnd);

// New layout: One outer table with 2px border, and rows for header, title, and then the data table below it.
// Actually, simpler: Just give a5-card a 2px border and remove internal margins.

// Let's just modify the styles in place to avoid large string manipulation
let newContent = content;

// 1. Remove border from a5-card if any (it has border: 1px solid #000)
// 2. Wrap header and title in a div with border-bottom
newContent = newContent.replace('border: 1px solid #000; ', 'border: 2px solid #000; padding: 0; '); // Increase card border and remove padding

// 3. Add padding and border-bottom to header table container
newContent = newContent.replace('width: \'100%\', marginBottom: \'10px\'', 'width: \'100%\', marginBottom: \'0\', padding: \'10px\', borderBottom: \'1px solid #000\'');

// 4. Modify title section to have no margin and a border bottom
newContent = newContent.replace('textAlign: \'center\', marginBottom: \'8px\'', 'textAlign: \'center\', padding: \'8px 0\', borderBottom: \'1px solid #000\', margin: 0');

// 5. Remove ptable margin bottom
newContent = newContent.replace('margin-bottom: 8px;', 'margin-bottom: 0;');

fs.writeFileSync(jsxPath, newContent);
console.log('Successfully updated Print Layout in UjianPage.jsx');
