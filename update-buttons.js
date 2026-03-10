import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('.tsx')) {
            files.push(name);
        }
    }
    return files;
}

const files = getFiles(path.join(__dirname, 'src', 'pages'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We already did Home, Login, Register. Let's skip them or do safely.
    // Replace <button with <LightBeamButton
    // Replace </button> with </LightBeamButton>
    content = content.replace(/<button/g, '<LightBeamButton');
    content = content.replace(/<\/button>/g, '</LightBeamButton>');

    if (content !== original) {
        // Add import if not exists
        if (!content.includes('LightBeamButton')) {
            // but we just added it, so it will. Let's check for the import statement.
            // actually if we replaced it, it definitely includes it.
        }

        if (!content.includes('import LightBeamButton')) {
            const importStatement = `import LightBeamButton from '../components/LightBeamButton';\n`;
            // insert after the last import
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
            } else {
                content = importStatement + content;
            }
        }

        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
