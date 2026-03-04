const grid = document.getElementById('poke-grid');
const regionFilter = document.getElementById('regionFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const qualitySwitch = document.getElementById('qualitySwitch');
const countLabel = document.getElementById('count');
const totalLabel = document.getElementById('total');

let allPokemon = [];
let ownedIds = new Set(JSON.parse(localStorage.getItem('pokeKeeper_owned')) || []);

// Load preference for quality
const savedQuality = localStorage.getItem('pokeKeeper_quality') === 'hd';
qualitySwitch.checked = savedQuality;

async function init() {
    const isHD = qualitySwitch.checked;
    const fileName = isHD ? 'pokemon_hd.json' : 'pokemon_lite.json';
    
    // Save preference
    localStorage.setItem('pokeKeeper_quality', isHD ? 'hd' : 'lite');

    try {
        grid.innerHTML = '<p class="loading">Loading Pokémon Data...</p>';
        const response = await fetch(fileName);
        allPokemon = await response.json();
        totalLabel.innerText = allPokemon.length;
        render();
    } catch (err) {
        grid.innerHTML = `<p class="error">Error loading ${fileName}. Check your Python export!</p>`;
        console.error(err);
    }
}

function togglePoke(id) {
    if (ownedIds.has(id)) {
        ownedIds.delete(id);
    } else {
        ownedIds.add(id);
    }
    localStorage.setItem('pokeKeeper_owned', JSON.stringify([...ownedIds]));
    render();
}

function render() {
    const region = regionFilter.value;
    const status = statusFilter.value;
    const search = searchInput.value.toLowerCase();
    
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    allPokemon.forEach(poke => {
        const isOwned = ownedIds.has(poke.id);
        const matchRegion = (region === 'all' || poke.region === region);
        const matchStatus = (status === 'all') || 
                          (status === 'owned' && isOwned) || 
                          (status === 'missing' && !isOwned);
        const matchSearch = poke.name.toLowerCase().includes(search) || 
                           poke.id.toString().includes(search);

        if (matchRegion && matchStatus && matchSearch) {
            const card = document.createElement('div');
            card.className = `card ${isOwned ? 'owned' : ''}`;
            card.innerHTML = `
                <div class="poke-id">#${poke.id}</div>
                <img src="${poke.image}" alt="${poke.name}" loading="lazy">
                <div class="poke-name">${poke.name}</div>
                <div class="status-btn">${isOwned ? 'COLLECTED' : 'MARK CAUGHT'}</div>
            `;
            card.onclick = () => togglePoke(poke.id);
            fragment.appendChild(card);
        }
    });

    grid.appendChild(fragment);
    countLabel.innerText = ownedIds.size;
}

// Listeners
regionFilter.addEventListener('change', render);
statusFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);
qualitySwitch.addEventListener('change', init); // Re-run init to fetch new JSON

// Backup & Restore Logic
document.getElementById('downloadBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify([...ownedIds]);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'pokekeeper_backup.json');
    linkElement.click();
});

document.getElementById('restoreInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedIds = JSON.parse(e.target.result);
            if (Array.isArray(importedIds)) {
                if (confirm(`Restore ${importedIds.length} Pokémon?`)) {
                    ownedIds = new Set(importedIds);
                    localStorage.setItem('pokeKeeper_owned', JSON.stringify([...ownedIds]));
                    render();
                }
            }
        } catch (err) { alert("Invalid Backup File"); }
    };
    reader.readAsText(file);
});

init();
