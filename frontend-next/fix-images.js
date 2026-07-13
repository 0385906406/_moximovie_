const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('./components/frontend');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Some files might have `https://phimimg.com/${...}`
    const regex = /\`https:\/\/phimimg\.com\/\$\{([^}]+)\}\`/g;
    
    let changed = false;
    let newContent = content.replace(regex, (match, p1) => {
        changed = true;
        // p1 is the variable, e.g., movie.poster_url
        return `(${p1}?.startsWith('http') ? ${p1} : \`https://phimimg.com/\${${p1}}\`)`;
    });
    
    if (changed) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log('Fixed:', file);
    }
});

console.log('Total files changed:', changedFiles);
