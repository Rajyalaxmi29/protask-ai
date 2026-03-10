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
        } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
            files.push(name);
        }
    }
    return files;
}

const files = getFiles(path.join(__dirname, 'src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Background replacements
    content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-[#030303]');
    content = content.replace(/bg-\[#141414\]/g, 'bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10');
    content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-[#0a0a0a]/70 backdrop-blur-xl border-white/10');
    content = content.replace(/bg-[#0F172A]/gi, 'bg-[#030303]');
    content = content.replace(/bg-slate-900/g, 'bg-[#030303]');
    content = content.replace(/bg-black/g, 'bg-[#030303]');

    // Typography for Headings (Instrument Serif)
    const headingRegex = /className="([^"]*(?:text-2xl|text-3xl|text-4xl|text-5xl|text-6xl|text-7xl|text-8xl|text-9xl)[^"]*)"/g;
    content = content.replace(headingRegex, (match, p1) => {
        let classes = p1;
        if (!classes.includes('font-serif')) {
            classes = classes.replace(/font-bold/g, 'font-serif font-normal tracking-[-0.02em]');
            classes = classes.replace(/font-semibold/g, 'font-serif font-normal tracking-[-0.02em]');
            if (!classes.includes('font-serif')) {
                classes += ' font-serif font-normal tracking-[-0.02em]';
            }
            return `className="${classes}"`;
        }
        return match;
    });

    // Small Data/Metrics
    const dataRegex = /className="([^"]*text-\[(?:10px|12px|xs)\][^"]*uppercase[^"]*)"/g;
    content = content.replace(dataRegex, (match, p1) => {
        let classes = p1;
        if (!classes.includes('tracking-widest')) {
            classes += ' tracking-widest font-mono';
            return `className="${classes}"`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
