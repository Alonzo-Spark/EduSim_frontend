const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const DATA_DIR = path.join(__dirname, 'src', 'data');

// Master Categories
const MASTER_CATEGORIES = {
    elements: ['element'],
    doors: ['door', 'doorway'],
    lasers: ['laser'],
    ships: ['ship', 'spaceships', 'ufo', 'cockpit', 'wing'],
    vehicles: ['ambulance', 'buggy', 'bus', 'car', 'cart', 'convertible', 'cycle', 'firetruck', 'formula', 'highway', 'kart', 'motorcycle', 'police', 'racer', 'scooter', 'sedan', 'suv', 'taxi', 'towtruck', 'tractor', 'transport', 'truck', 'van', 'vintage', 'engine', 'tires', 'track'],
    animals: ['alien', 'barnacle', 'bat', 'bear', 'bee', 'buffalo', 'bunny', 'chick', 'chicken', 'cow', 'crocodile', 'dog', 'dragon', 'duck', 'elephant', 'fish', 'fly', 'frog', 'giraffe', 'goat', 'gorilla', 'hippo', 'horse', 'ladybug', 'monkey', 'moose', 'narwhal', 'owl', 'parrot', 'penguin', 'pig', 'rabbit', 'rhino', 'sloth', 'snail', 'snake', 'walrus', 'whale', 'worm', 'zebra', 'animal', 'slime'],
    terrain: ['center', 'cliff', 'corner', 'dirt', 'grass', 'half', 'hill', 'ice', 'land', 'lava', 'planet', 'puddle', 'road', 'sand', 'snow', 'terrain', 'water', 'ground', 'hole', 'portal', 'tile'],
    space: ['astronaut', 'meteor', 'moon', 'space', 'star', 'sun'],
    weapons: ['bomb', 'bullet', 'gun', 'missile', 'rifle', 'shot', 'sword', 'weapon', 'shield', 'riot', 'turret'],
    characters: ['adventurer', 'boy', 'character', 'enemy', 'female', 'girl', 'man', 'player', 'soldier', 'woman', 'zombie', 'arm', 'body', 'hand', 'head', 'leg', 'helmet'],
    effects: ['beam', 'bolt', 'bubble', 'cloud', 'effect', 'fire', 'fireball', 'flame', 'light', 'lightning', 'noise', 'particle', 'smoke', 'speed', 'trail', 'scratch', 'skidmark', 'torch', 'powerup'],
    UI: ['arrow', 'bar', 'button', 'card', 'crosshair', 'cursor', 'hud', 'icon', 'panel', 'sign', 'text', 'ui', 'window', 'bold', 'color', 'numeral', 'number', 'symbol', 'bg', 'background', 'black', 'blue', 'bronze', 'dark', 'gold', 'purple', 'silver', 'rounded', 'coin', 'gem', 'flag', 'target'],
    buildings: ['bridge', 'building', 'castle', 'dome', 'house', 'pyramid', 'station', 'tent', 'tower', 'wall', 'bed', 'chair', 'curtain', 'floor', 'stairs', 'table', 'coffin', 'fence', 'tribune', 'vendor'],
    nature: ['bush', 'cactus', 'log', 'mushroom', 'nature', 'plant', 'tree', 'wood', 'stick'],
    physics: ['ball', 'block', 'box', 'chain', 'cone', 'cube', 'lever', 'magnet', 'physics', 'ramp', 'saw', 'sphere', 'spring', 'switch', 'weight', 'spike', 'sprung', 'trap'],
    misc: ['golf', 'racket', 'sports', 'things', 'misc']
};

const COLORS = ['blue', 'green', 'pink', 'yellow', 'red', 'beige', 'grey', 'brown', 'black', 'white', 'purple', 'orange', 'silver', 'gold', 'bronze'];
const VARIANTS = ['open', 'closed', 'center', 'cliff', 'corner', 'half', 'hill', 'top', 'mid', 'base', 'outline'];

function getCategory(baseName) {
    let lowerName = baseName.toLowerCase();
    
    // Strip numbers
    lowerName = lowerName.replace(/[0-9_()]/g, '');
    
    // Strip colors and variants
    COLORS.forEach(color => { lowerName = lowerName.replace(color, ''); });
    VARIANTS.forEach(variant => { lowerName = lowerName.replace(variant, ''); });
    
    // Handle specific plurals / singulars
    if (lowerName.endsWith('s') && lowerName !== 'grass') {
        lowerName = lowerName.slice(0, -1);
    }
    
    // Find best match in master categories
    for (const [catName, keywords] of Object.entries(MASTER_CATEGORIES)) {
        if (catName === 'misc') continue;
        if (keywords.some(kw => lowerName.includes(kw) || baseName.toLowerCase().includes(kw))) {
            return catName;
        }
    }
    return 'misc';
}

function generateTags(baseName, category) {
    let parts = baseName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/[0-9()]/g, ' ').trim().split(/\s+/);
    let tags = parts.map(p => p.toLowerCase()).filter(p => p.length > 0);
    
    // Auto-detect colors and variants
    COLORS.forEach(color => {
        if (baseName.toLowerCase().includes(color)) tags.push(color);
    });
    VARIANTS.forEach(variant => {
        if (baseName.toLowerCase().includes(variant)) tags.push(variant);
    });
    
    // Add base category singular as tag
    tags.push(category.replace(/s$/, '')); 
    
    return [...new Set(tags)];
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function run() {
    console.log('Starting intelligent asset organization...');
    
    let allFiles = [];
    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            } else {
                allFiles.push(fullPath);
            }
        }
    }
    
    scanDir(ASSETS_DIR);
    console.log(`Found ${allFiles.length} files to process.`);
    
    const objectData = {};
    const categoriesMap = {};
    const searchIndex = [];
    
    for (const filePath of allFiles) {
        const fileName = path.basename(filePath);
        const baseName = path.basename(fileName, path.extname(fileName));
        
        const category = getCategory(baseName);
        const tags = generateTags(baseName, category);
        
        const targetDir = path.join(ASSETS_DIR, category);
        ensureDir(targetDir);
        
        const targetPath = path.join(targetDir, fileName);
        
        if (filePath !== targetPath) {
            if (fs.existsSync(targetPath)) {
                const statOrig = fs.statSync(filePath);
                const statTarget = fs.statSync(targetPath);
                if (statOrig.size !== statTarget.size) {
                    const uniqueTargetPath = path.join(targetDir, `${baseName}_variant${path.extname(fileName)}`);
                    fs.renameSync(filePath, uniqueTargetPath);
                    objectData[`${baseName}_variant`] = {
                        category: category,
                        tags: tags,
                        file: `${category}/${path.basename(uniqueTargetPath)}`
                    };
                } else {
                    fs.unlinkSync(filePath);
                }
            } else {
                fs.renameSync(filePath, targetPath);
            }
        }
        
        objectData[baseName] = {
            category: category,
            tags: tags,
            file: `${category}/${fileName}`
        };
        
        if (!categoriesMap[category]) {
            categoriesMap[category] = [];
        }
        if (!categoriesMap[category].includes(baseName)) {
            categoriesMap[category].push(baseName);
        }
        
        searchIndex.push({
            id: baseName,
            category: category,
            tags: tags.join(' ')
        });
    }
    
    console.log('Files moved successfully.');
    
    function cleanEmptyDirs(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                cleanEmptyDirs(fullPath);
                if (fs.existsSync(fullPath)) {
                    const afterCleanItems = fs.readdirSync(fullPath);
                    if (afterCleanItems.length === 0) {
                        fs.rmdirSync(fullPath);
                    }
                }
            }
        }
    }
    
    cleanEmptyDirs(ASSETS_DIR);
    console.log('Cleaned up empty directories.');
    
    ensureDir(DATA_DIR);
    
    const objectDataCode = `// Generated intelligent object data\nmodule.exports = ${JSON.stringify(objectData, null, 2)};\n`;
    fs.writeFileSync(path.join(DATA_DIR, 'objectData.js'), objectDataCode);
    fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categoriesMap, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'searchIndex.json'), JSON.stringify(searchIndex, null, 2));
    
    console.log('Metadata files generated in src/data/:');
    console.log('- objectData.js');
    console.log('- categories.json');
    console.log('- searchIndex.json');
    
    console.log('Intelligent organization complete!');
}

run();
