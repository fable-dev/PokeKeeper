const grid = document.getElementById('poke-grid');
const regionFilter = document.getElementById('regionFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const countLabel = document.getElementById('count');
const totalLabel = document.getElementById('total');

let allPokemon = [];
let ownedIds = new Set(JSON.parse(localStorage.getItem('pokeKeeper_owned')) || []);

// Load the JSON you generated with Python
async function init() {
    try {
        const response = await fetch('pokemon.json');
        allPokemon = await response.json();
        totalLabel.innerText = allPokemon.length;
        render();
    } catch (err) {
        grid.innerHTML = `<p class="error">Error loading pokemon.json. Did you run the Python script?</p>`;
        console.error(err);
    }
}

function togglePoke(id) {
    if (ownedIds.has(id)) {
        ownedIds.delete(id);
    } else {
        ownedIds.add(id);
    }
    // Convert Set back to Array for LocalStorage
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
        
        // Filter Logic
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

// Event Listeners for real-time updates
regionFilter.addEventListener('change', render);
statusFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);

init();

// 1. DOWNLOAD BACKUP
document.getElementById('downloadBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify([...ownedIds]); // Convert Set to Array
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'pokekeeper_backup.json';
    const linkElement = document.createElement('a');
    
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

// 2. RESTORE FROM BACKUP
document.getElementById('restoreInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedIds = JSON.parse(e.target.result);
            
            if (Array.isArray(importedIds)) {
                if (confirm(`Restore ${importedIds.length} caught Pokémon? This will replace your current list.`)) {
                    ownedIds = new Set(importedIds);
                    localStorage.setItem('pokeKeeper_owned', JSON.stringify([...ownedIds]));
                    render();
                    alert("Progress Restored!");
                }
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Error reading file. Make sure it's a valid JSON backup.");
        }
    };
    reader.readAsText(file);
});
