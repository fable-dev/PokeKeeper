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
let activeDashFilter = "all";

// Quality Preference
qualitySwitch.checked = localStorage.getItem('pokeKeeper_quality') === 'hd';

async function init() {
    const isHD = qualitySwitch.checked;
    const fileName = isHD ? 'pokemon_hd.json' : 'pokemon_lite.json';
    localStorage.setItem('pokeKeeper_quality', isHD ? 'hd' : 'lite');

    try {
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
    
    progressBar.style.width = `${percent}%`;
    percentLabel.innerText = `${percent}% (${caught}/${total})`;

    const regions = ["kanto", "johto", "hoenn", "sinnoh", "unova", "kalos", "alola", "galar", "paldea"];
    genBreakdown.innerHTML = '';
    
    regions.forEach(reg => {
        const regPokes = allPokemon.filter(p => p.region === reg);
        if (regPokes.length === 0) return;

        const regCaught = regPokes.filter(p => ownedIds.has(p.id)).length;
        const regChip = document.createElement('div');
        regChip.className = `gen-stat ${activeDashFilter === reg ? 'active' : ''}`;
        
        regChip.innerHTML = `
            <span class="reg-name">${reg.toUpperCase()}</span>
            <span class="reg-count">${regCaught}/${regPokes.length}</span>
        `;

        regChip.onclick = () => {
            activeDashFilter = (activeDashFilter === reg) ? "all" : reg;
            regionFilter.value = activeDashFilter; // Sync the dropdown
            render();
        };
        genBreakdown.appendChild(regChip);
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
    activeDashFilter = region; // Sync dash with dropdown
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
regionFilter.onchange = render;
statusFilter.onchange = render;
searchInput.oninput = render;
qualitySwitch.onchange = init;

// Backup/Restore
// --- UPDATED DOWNLOAD BACKUP ---
document.getElementById('downloadBtn').onclick = () => {
    // Convert Set to a comma-separated string
    const idString = [...ownedIds].join(',');
    
    const backupData = {
        type: "customPokemonIds",
        settings: idString
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "pokekeeper_backup.json");
    dl.click();
};

// --- UPDATED RESTORE FROM BACKUP ---
document.getElementById('restoreInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const json = JSON.parse(ev.target.result);
            
            // Validation: Check for your custom type
            if (json.type === "customPokemonIds" && typeof json.settings === "string") {
                const importedArray = json.settings.split(',')
                                         .filter(id => id !== "") // Remove empty strings
                                         .map(Number);           // Convert to numbers

                if (confirm(`Restore ${importedArray.length} Pokémon? This will overwrite current progress.`)) {
                    ownedIds = new Set(importedArray);
                    localStorage.setItem('pokeKeeper_owned', JSON.stringify([...ownedIds]));
                    render();
                }
            } else {
                alert("Error: This file is not a valid PokeKeeper backup.");
            }
        } catch (err) {
            alert("Error: Failed to parse the JSON file.");
        }
    };
    reader.readAsText(file);
};

init();
