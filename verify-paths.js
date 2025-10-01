// Verification script to check all paths in index.html
// Run this in the browser console when index.html is loaded

console.log('=== Path Verification Script ===\n');

const checks = {
    css: false,
    js: false,
    audio: false,
    games: false
};

// Check CSS
const cssLink = document.querySelector('link[href*="styles.css"]');
if (cssLink) {
    console.log('✓ CSS link found:', cssLink.href);
    // Check if styles are applied
    const header = document.querySelector('.app-header');
    if (header && window.getComputedStyle(header).fontFamily.includes('Bangers')) {
        console.log('✓ CSS styles applied correctly (Bangers font detected)');
        checks.css = true;
    } else {
        console.log('⚠ CSS link exists but styles may not be applied');
    }
} else {
    console.log('✗ CSS link not found');
}

// Check JavaScript
const jsScript = document.querySelector('script[src*="app.js"]');
if (jsScript) {
    console.log('✓ JavaScript link found:', jsScript.src);
    // Check if app.js functions are available
    if (typeof window.state !== 'undefined' || document.querySelector('#createBtn')) {
        console.log('✓ JavaScript loaded and executed');
        checks.js = true;
    }
} else {
    console.log('✗ JavaScript link not found');
}

// Check Audio
const audio = document.querySelector('#bgAudio');
if (audio) {
    console.log('✓ Audio element found:', audio.src);
    audio.addEventListener('loadeddata', () => {
        console.log('✓ Audio file loaded successfully, duration:', audio.duration.toFixed(2) + 's');
        checks.audio = true;
    });
    audio.addEventListener('error', (e) => {
        console.log('✗ Audio file failed to load:', e);
    });
} else {
    console.log('✗ Audio element not found');
}

// Check game links (these are in app.js, so we check the paths)
console.log('\n=== Game Paths (from app.js) ===');
console.log('Expected game paths (relative to Editor/app.js):');
console.log('  - ../Games/RunRunRabbit/index.html');
console.log('  - ../Games/Tornado/index.html');
console.log('  - ../Games/Icebreak/index.html');

// Test game path resolution
const testGamePaths = [
    './Games/RunRunRabbit/index.html',
    './Games/Tornado/index.html',
    './Games/Icebreak/index.html'
];

Promise.all(testGamePaths.map(path => 
    fetch(path, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                console.log('✓ Game accessible:', path);
                return true;
            } else {
                console.log('✗ Game not accessible:', path);
                return false;
            }
        })
        .catch(error => {
            console.log('✗ Game check failed:', path, error.message);
            return false;
        })
)).then(results => {
    checks.games = results.every(r => r);
    
    // Final summary
    setTimeout(() => {
        console.log('\n=== Verification Summary ===');
        console.log('CSS:', checks.css ? '✓ PASS' : '✗ FAIL');
        console.log('JavaScript:', checks.js ? '✓ PASS' : '✗ FAIL');
        console.log('Audio:', checks.audio ? '✓ PASS' : '✗ FAIL');
        console.log('Games:', checks.games ? '✓ PASS' : '✗ FAIL');
        
        const allPassed = Object.values(checks).every(v => v);
        console.log('\n' + (allPassed ? '✓ ALL CHECKS PASSED' : '⚠ SOME CHECKS FAILED'));
    }, 2000);
});