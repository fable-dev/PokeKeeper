const grid = document.getElementById('poke-grid');
const regionFilter = document.getElementById('regionFilter');
const statusFilter = document.getElementById('statusFilter');
const countLabel = document.getElementById('count');

let allPokemon = [];
let ownedIds = JSON.parse(localStorage.getItem('pokeKeeper_owned')) || [];

// 1. Load your local JSON file
async function init() {
    try {
        const response = await fetch('pokemon.json');
        allPokemon = await response.json();
        document.getElementById('total').innerText = allPokemon.length;
        render();
    } catch (err) {
        console.error("Error loading JSON. Make sure pokemon.json exists!", err);
    }
}

// 2. Toggle Ownership
function togglePoke(id) {
    if (ownedIds.includes(id)) {
        ownedIds = ownedIds.filter(pokeId => pokeId !== id);
    } else {
        ownedIds.push(id);
    }
    localStorage.setItem('pokeKeeper_owned', JSON.stringify(ownedIds));
    render();
}

// 3. Render Grid
function render() {
    const region = regionFilter.value;
    const status = statusFilter.value;
    
    grid.innerHTML = '';
    let visibleCount = 0;

    allPokemon.forEach(poke => {
        const isOwned = ownedIds.includes(poke.id);
        
        // Filter Logic
        const matchRegion = (region === 'all') || (poke.region === region);
        const matchStatus = (status === 'all') || 
                          (status === 'owned' && isOwned) || 
                          (status === 'missing' && !isOwned);

        if (matchRegion && matchStatus) {
            const card = document.createElement('div');
            card.className = `card ${isOwned ? 'owned' : ''}`;
            card.onclick = () => togglePoke(poke.id);
            card.innerHTML = `
                <img src="${poke.image}" alt="${poke.name}">
                <p>#${poke.id} <strong>${poke.name}</strong></p>
                <div class="status-indicator">${isOwned ? '✓ Caught' : '○ Missing'}</div>
            `;
            grid.appendChild(card);
        }
    });

    countLabel.innerText = ownedIds.length;
}

regionFilter.onchange = render;
statusFilter.onchange = render;
init();
