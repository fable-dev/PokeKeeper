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
