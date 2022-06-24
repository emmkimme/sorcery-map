// A bit ugly but can not decide what would be the best name for this lib !! ;-)
const child_process = require('child_process');
const fse = require('fs-extra');

const fileREADME = fse.readFileSync('README.md').toString();
const filePACKAGEJSON = fse.readFileSync('package.json');

try {
    const newFileREADME = fileREADME.replace(/sourcery/gi, (match) => match.replace('u', ''));
    fse.writeFileSync('README.md', newFileREADME);

    const contentPACKAGEJSON = JSON.parse(filePACKAGEJSON.toString());
    contentPACKAGEJSON.name = contentPACKAGEJSON.name.replace(/sourcery/gi, (match) => match.replace('u', ''));
    Object.keys(contentPACKAGEJSON.bin).forEach((key) => {
        const new_key = key.replace(/sourcery/gi, (match) => match.replace('u', ''));
        if (new_key !== key) {
            contentPACKAGEJSON.bin[new_key] = contentPACKAGEJSON.bin[key];
            delete contentPACKAGEJSON.bin[key];
        }
    });
    fse.writeJSONSync('package.json', contentPACKAGEJSON);

    child_process.execSync('npm run deploy');
}
catch (err) {
}

fse.writeFileSync('README.md', fileREADME);
fse.writeFileSync('package.json', filePACKAGEJSON);

child_process.execSync('npm run deploy');
