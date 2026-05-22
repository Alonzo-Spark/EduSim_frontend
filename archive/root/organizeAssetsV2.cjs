const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const DATA_DIR = path.join(__dirname, 'src', 'data');

const COLORS = ['blue', 'green', 'pink', 'yellow', 'red', 'beige', 'biege', 'grey', 'brown', 'black', 'white', 'purple', 'orange', 'silver', 'gold', 'bronze'];
const STATES = ['walk', 'jump', 'idle', 'climb', 'swim', 'hurt', 'stand', 'hit', 'fall', 'action', 'cheer', 'hang', 'hold', 'kick', 'skid', 'slide', 'talk', 'down', 'point', 'fly', 'ready', 'attack', 'dead', 'move'];
const VARIANTS = ['open', 'closed', 'center', 'cliff', 'corner', 'half', 'hill', 'top', 'mid', 'base', 'outline', 'damaged', 'demolished', 'diagonal', 'edge', 'secret', 'straight', 'rope', 'empty', 'full', 'overhang', 'striped', 'left', 'right', 'front', 'back', 'long', 'short'];

const ROUTING_MAP = [
    { root: ['adventurer', 'player', 'man', 'woman', 'boy', 'girl', 'character'], primary: 'characters', sub: 'player' },
    { root: ['enemy', 'zombie', 'alien', 'slime'], primary: 'characters', sub: 'enemies' },
    { root: ['arm', 'body', 'hand', 'head', 'leg', 'helmet'], primary: 'characters', sub: 'parts' },
    { root: ['soldier', 'female'], primary: 'characters', sub: 'npcs' },

    { root: ['grass'], primary: 'terrain', sub: 'grass' },
    { root: ['dirt'], primary: 'terrain', sub: 'dirt' },
    { root: ['sand'], primary: 'terrain', sub: 'sand' },
    { root: ['snow', 'ice'], primary: 'terrain', sub: 'snow' },
    { root: ['planet'], primary: 'terrain', sub: 'planet' },
    { root: ['water', 'puddle'], primary: 'terrain', sub: 'water' },
    { root: ['lava'], primary: 'terrain', sub: 'lava' },
    { root: ['road', 'track', 'path', 'highway'], primary: 'terrain', sub: 'road' },
    { root: ['tile', 'ground', 'hole', 'portal', 'floor', 'stairs'], primary: 'terrain', sub: 'tiles' },

    { root: ['block', 'box', 'cube', 'lever', 'magnet', 'saw', 'switch', 'trap', 'doorway'], primary: 'physics', sub: 'interactables' },
    { root: ['spring', 'sprung'], primary: 'physics', sub: 'springs' },
    { root: ['ball', 'sphere'], primary: 'physics', sub: 'balls' },
    { root: ['spike'], primary: 'physics', sub: 'spikes' },
    { root: ['weight'], primary: 'physics', sub: 'weights' },
    { root: ['chain'], primary: 'physics', sub: 'chains' },

    { root: ['ambulance', 'buggy', 'bus', 'car', 'cart', 'convertible', 'cycle', 'firetruck', 'formula', 'kart', 'motorcycle', 'police', 'racer', 'scooter', 'sedan', 'suv', 'taxi', 'towtruck', 'tractor', 'transport', 'truck', 'van', 'vintage'], primary: 'vehicles', sub: 'land' },
    { root: ['engine', 'tires'], primary: 'vehicles', sub: 'parts' },

    { root: ['ship', 'ufo', 'cockpit', 'wing'], primary: 'space', sub: 'vehicles' },
    { root: ['meteor'], primary: 'space', sub: 'meteors' },
    { root: ['station'], primary: 'space', sub: 'stations' },
    { root: ['astronaut'], primary: 'space', sub: 'astronauts' },
    { root: ['moon', 'space', 'star', 'sun'], primary: 'space', sub: 'environment' },

    { root: ['bomb', 'bullet', 'gun', 'missile', 'rifle', 'shot', 'sword', 'weapon'], primary: 'weapons', sub: 'offensive' },
    { root: ['shield', 'riot', 'turret'], primary: 'weapons', sub: 'defensive' },

    { root: ['icon', 'button', 'arrow', 'crosshair', 'cursor', 'sign', 'panel', 'window', 'hud', 'bar', 'card', 'coin', 'gem', 'flag'], primary: 'UI', sub: 'icons' },
    { root: ['text', 'bold', 'numeral', 'number', 'symbol'], primary: 'UI', sub: 'text' },
    { root: ['target'], primary: 'UI', sub: 'targets' },
    { root: ['bg', 'background', 'black', 'blue', 'bronze', 'dark', 'gold', 'purple', 'silver', 'rounded'], primary: 'UI', sub: 'backgrounds' },

    { root: ['bridge', 'building', 'castle', 'dome', 'house', 'pyramid', 'station', 'tent', 'tower', 'wall', 'fence', 'tribune', 'vendor'], primary: 'buildings', sub: 'structures' },
    { root: ['bed', 'chair', 'curtain', 'table', 'coffin'], primary: 'buildings', sub: 'furniture' },
    { root: ['door'], primary: 'buildings', sub: 'doors' },

    { root: ['beam', 'bolt', 'laser'], primary: 'effects', sub: 'lasers' },
    { root: ['fire', 'fireball', 'flame', 'torch', 'campfire'], primary: 'effects', sub: 'fire' },
    { root: ['bubble', 'cloud', 'smoke', 'particle', 'noise'], primary: 'effects', sub: 'particles' },
    { root: ['light', 'lightning'], primary: 'effects', sub: 'light' },
    { root: ['scratch', 'skidmark', 'speed', 'trail', 'effect'], primary: 'effects', sub: 'misc' },
    { root: ['powerup'], primary: 'effects', sub: 'powerups' },

    { root: ['bush', 'cactus', 'log', 'mushroom', 'nature', 'plant', 'tree', 'wood', 'stick'], primary: 'nature', sub: 'plants' },

    { root: ['barnacle', 'bat', 'bear', 'bee', 'buffalo', 'bunny', 'chick', 'chicken', 'cow', 'crocodile', 'dog', 'dragon', 'duck', 'elephant', 'fish', 'fly', 'frog', 'giraffe', 'goat', 'gorilla', 'hippo', 'horse', 'ladybug', 'monkey', 'moose', 'narwhal', 'owl', 'parrot', 'penguin', 'pig', 'rabbit', 'rhino', 'sloth', 'snail', 'snake', 'walrus', 'whale', 'worm', 'zebra', 'animal'], primary: 'animals', sub: 'creatures' },

    { root: ['element'], primary: 'elements', sub: 'generic' }
];

function getRoute(objectFamily, baseName) {
    let lowerName = objectFamily.toLowerCase();
    for (const mapping of ROUTING_MAP) {
        if (mapping.root.includes(lowerName)) {
            return { primary: mapping.primary, sub: mapping.sub };
        }
    }
    for (const mapping of ROUTING_MAP) {
        if (mapping.root.some(kw => lowerName.includes(kw) || baseName.toLowerCase().includes(kw))) {
            return { primary: mapping.primary, sub: mapping.sub };
        }
    }
    return { primary: 'misc', sub: 'uncategorized' };
}

function parseSemantics(fullPath) {
    let fileName = path.basename(fullPath);
    let baseName = path.basename(fileName, path.extname(fileName));
    let objectFamily = baseName;
    let color = null;
    let state = null;
    let frame = null;
    let tileSuffixes = [];
    
    const frameMatch = baseName.match(/([0-9()]+)$/);
    if (frameMatch) {
        frame = frameMatch[1].replace(/[()]/g, '');
        objectFamily = objectFamily.replace(frameMatch[1], '');
    }
    
    for (let c of COLORS) {
        if (baseName.toLowerCase().includes(c)) {
            color = c;
            objectFamily = objectFamily.replace(new RegExp(c, 'ig'), '');
            break;
        }
    }
    
    let parts = baseName.split('_');
    for (let s of STATES) {
        if (parts.length > 1 && parts[1].toLowerCase().includes(s)) {
            state = s;
            objectFamily = objectFamily.replace(new RegExp('_?' + s, 'ig'), '');
        } else if (baseName.toLowerCase().includes(s)) {
            state = s;
            objectFamily = objectFamily.replace(new RegExp(s, 'ig'), '');
        }
    }
    
    for (let v of VARIANTS) {
        if (baseName.toLowerCase().includes(v)) {
            tileSuffixes.push(v);
            objectFamily = objectFamily.replace(new RegExp('_?' + v, 'ig'), '');
        }
    }

    objectFamily = objectFamily.replace(/_+$/, ''); 
    if (!objectFamily || objectFamily === '') {
        objectFamily = baseName.replace(/[0-9_]/g, '').toLowerCase();
    }
    if (baseName.toLowerCase().includes('cockpit')) objectFamily = 'cockpit';
    
    const route = getRoute(objectFamily, baseName);

    let tags = [route.primary, route.sub, objectFamily];
    if (color) tags.push(color);
    if (state) tags.push(state);
    if (frame) tags.push(`frame${frame}`);
    tags = [...new Set(tags)];

    return {
        baseName,
        fileName,
        objectFamily,
        color,
        animationState: state,
        frame,
        tileSuffixes,
        primary: route.primary,
        sub: route.sub,
        tags
    };
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function run() {
    console.log('Starting advanced V2 asset organization...');
    
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
        const parsed = parseSemantics(filePath);
        
        // Deeply nested folder path: public/assets/characters/enemies/alien/alienBeige_walk1.png
        const targetDir = path.join(ASSETS_DIR, parsed.primary, parsed.sub, parsed.objectFamily);
        ensureDir(targetDir);
        
        const targetPath = path.join(targetDir, parsed.fileName);
        
        if (filePath !== targetPath) {
            if (fs.existsSync(targetPath)) {
                const statOrig = fs.statSync(filePath);
                const statTarget = fs.statSync(targetPath);
                if (statOrig.size !== statTarget.size) {
                    const uniqueTargetPath = path.join(targetDir, `${parsed.baseName}_v${path.extname(parsed.fileName)}`);
                    fs.renameSync(filePath, uniqueTargetPath);
                    parsed.fileName = path.basename(uniqueTargetPath);
                } else {
                    fs.unlinkSync(filePath);
                    continue; // Skip metadata since it was a duplicate
                }
            } else {
                fs.renameSync(filePath, targetPath);
            }
        }
        
        const finalFilePath = `${parsed.primary}/${parsed.sub}/${parsed.objectFamily}/${parsed.fileName}`;
        
        objectData[parsed.baseName] = {
            category: parsed.primary,
            subCategory: parsed.sub,
            objectFamily: parsed.objectFamily,
            color: parsed.color,
            animationState: parsed.animationState,
            frame: parsed.frame ? parseInt(parsed.frame, 10) || parsed.frame : null,
            tileSuffixes: parsed.tileSuffixes,
            tags: parsed.tags,
            file: finalFilePath
        };
        
        if (!categoriesMap[parsed.primary]) categoriesMap[parsed.primary] = {};
        if (!categoriesMap[parsed.primary][parsed.sub]) categoriesMap[parsed.primary][parsed.sub] = [];
        if (!categoriesMap[parsed.primary][parsed.sub].includes(parsed.objectFamily)) {
            categoriesMap[parsed.primary][parsed.sub].push(parsed.objectFamily);
        }
        
        searchIndex.push({
            id: parsed.baseName,
            primary: parsed.primary,
            sub: parsed.sub,
            family: parsed.objectFamily,
            tags: parsed.tags.join(' ')
        });
    }
    
    console.log('Files moved successfully into nested structure.');
    
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
    console.log('Cleaned up old flattened directories.');
    
    ensureDir(DATA_DIR);
    
    fs.writeFileSync(path.join(DATA_DIR, 'objectData.js'), `// V2 Deep Metadata System\nmodule.exports = ${JSON.stringify(objectData, null, 2)};\n`);
    fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categoriesMap, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'searchIndex.json'), JSON.stringify(searchIndex, null, 2));
    
    console.log('Enhanced metadata files generated in src/data/:');
    console.log('- objectData.js');
    console.log('- categories.json');
    console.log('- searchIndex.json');
    
    console.log('Advanced V2 organization complete!');
}

run();
