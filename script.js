const grid = document.getElementById('poke-grid');
const regionFilter = document.getElementById('regionFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const qualitySwitch = document.getElementById('qualitySwitch');
const progressBar = document.getElementById('progressBar');
const percentLabel = document.getElementById('percent');
const genBreakdown = document.getElementById('genBreakdown');

let allPokemon = [];
let ownedIds = new Set(JSON.parse(localStorage.getItem('pokeKeeper_owned')) || []);

// Quality Preference
qualitySwitch.checked = localStorage.getItem('pokeKeeper_quality') === 'hd';

async function init() {
    const isHD = qualitySwitch.checked;
    const fileName = isHD ? 'pokemon_hd.json' : 'pokemon_lite.json';
    localStorage.setItem('pokeKeeper_quality', isHD ? 'hd' : 'lite');

    try {
        grid.innerHTML = '<p>Loading Dex Data...</p>';
        const response = await fetch(fileName);
        allPokemon = await response.json();
        render();
    } catch (err) {
        grid.innerHTML = `<p class="error">Error loading ${fileName}.</p>`;
    }
}

function calculateStats() {
    const total = allPokemon.length;
    const caught = ownedIds.size;
    const percent = total > 0 ? Math.round((caught / total) * 100) : 0;
    
    // Update main progress bar
    progressBar.style.width = `${percent}%`;
    percentLabel.innerText = `${percent}% (${caught}/${total})`;

    // Calculate Region Breakdown
    const regions = [...new Set(allPokemon.map(p => p.region))];
    genBreakdown.innerHTML = '';
    
    regions.forEach(reg => {
        const regPokes = allPokemon.filter(p => p.region === reg);
        const regCaught = regPokes.filter(p => ownedIds.has(p.id)).length;
        const regSpan = document.createElement('span');
        regSpan.className = 'gen-stat';
        regSpan.innerHTML = `<strong>${reg.toUpperCase()}:</strong> ${regCaught}/${regPokes.length}`;
        genBreakdown.appendChild(regSpan);
    });
}

function togglePoke(id) {
    if (ownedIds.has(id)) ownedIds.delete(id);
    else ownedIds.add(id);
    
    localStorage.setItem('pokeKeeper_owned', JSON.stringify([...ownedIds]));
    render();
}

function render() {
    const region = regionFilter.value;
    const status = statusFilter.value;
    const search = searchInput.value.toLowerCase();
    
    calculateStats();
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    allPokemon.forEach(poke => {
        const isOwned = ownedIds.has(poke.id);
        const matchRegion = (region === 'all' || poke.region === region);
        const matchStatus = (status === 'all') || (status === 'owned' && isOwned) || (status === 'missing' && !isOwned);
        const matchSearch = poke.name.toLowerCase().includes(search) || poke.id.toString().includes(search);

        if (matchRegion && matchStatus && matchSearch) {
            const card = document.createElement('div');
            card.className = `card ${isOwned ? 'owned' : ''}`;
            card.innerHTML = `
                <div class="poke-id">#${poke.id}</div>
                <img src="${poke.image}" alt="${poke.name}" loading="lazy">
                <div class="poke-name">${poke.name}</div>
                <div class="status-btn">${isOwned ? 'CAUGHT' : 'MISSING'}</div>
            `;
            card.onclick = () => togglePoke(poke.id);
            fragment.appendChild(card);
        }
    });
    grid.appendChild(fragment);
}

// Event Listeners
regionFilter.addEventListener('change', render);
statusFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);
qualitySwitch.addEventListener('change', init);

// Backup/Restore
document.getElementById('downloadBtn').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([...ownedIds]));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "pokekeeper_backup.json");
    downloadAnchor.click();
};

document.getElementById('restoreInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        ownedIds = new Set(JSON.parse(event.target.result));
        localStorage.setItem('pokeKeeper_owned', JSON.stringify([...ownedIds]));
        render();
    };
    reader.readAsText(e.target.files[0]);
};

init();
