const cropData = {
  padi: {
    id: 'padi',
    name: 'Padi',
    icon: '🌾',
    price: 12,
    growDays: 3,
    waterNeed: 1,
    color: '#d9d77f'
  },
  sayur: {
    id: 'sayur',
    name: 'Sayur',
    icon: '🥬',
    price: 18,
    growDays: 4,
    waterNeed: 2,
    color: '#a5d36c'
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    icon: '🍅',
    price: 22,
    growDays: 5,
    waterNeed: 2,
    color: '#f58d7b'
  },
  strawberi: {
    id: 'strawberi',
    name: 'Strawberi',
    icon: '🍓',
    price: 30,
    growDays: 6,
    waterNeed: 3,
    color: '#ffa0b2'
  },
  labu: {
    id: 'labu',
    name: 'Labu',
    icon: '🎃',
    price: 35,
    growDays: 7,
    waterNeed: 3,
    color: '#f3bf65'
  }
};

const villagers = [
  { name: 'Aisya', mood: 'ceria', icon: '👩‍🌾' },
  { name: 'Hadi', mood: 'baik hati', icon: '👨‍🌾' },
  { name: 'Nina', mood: 'tenang', icon: '🧑‍🌾' },
  { name: 'Aiman', mood: 'suka bantu', icon: '👨‍🍳' }
];

const STORAGE_KEY = 'kampungku-save-v1';

const initialState = () => ({
  day: 1,
  money: 150,
  energy: 10,
  maxEnergy: 10,
  weather: 'Cerah',
  selectedTool: 'hand',
  selectedSeed: 'padi',
  farm: Array.from({ length: 36 }, () => null),
  inventory: {
    padi: 5,
    sayur: 3,
    tomato: 2,
    strawberi: 1,
    labu: 0
  },
  log: [
    'Hari pertama di KampungKu. Semangat baru untuk bercucuk tanam!',
    'Cuaca hari ini cerah. Masa yang tepat untuk menanam sesuatu.'
  ],
  villagerIndex: 0,
  marketStatus: 'Jualan hari ini: tenang dan aman.'
});

let state = loadState();

const els = {
  dayValue: document.getElementById('dayValue'),
  weatherValue: document.getElementById('weatherValue'),
  moneyValue: document.getElementById('moneyValue'),
  energyValue: document.getElementById('energyValue'),
  selectedTool: document.getElementById('selectedTool'),
  seedPanel: document.getElementById('seedPanel'),
  inventoryList: document.getElementById('inventoryList'),
  villagerList: document.getElementById('villagerList'),
  logList: document.getElementById('logList'),
  farmGrid: document.getElementById('farmGrid'),
  marketStatus: document.getElementById('marketStatus'),
  toast: document.getElementById('toast'),
  buySeedBtn: document.getElementById('buySeedBtn'),
  nextDayBtn: document.getElementById('nextDayBtn')
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return saved;
    }
  } catch (error) {
    console.warn('Unable to load saved state:', error);
  }
  return initialState();
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove('show');
  }, 1800);
}

function formatMoney(value) {
  return `RM ${Number(value).toFixed(2)}`;
}

function getCropStage(tile) {
  if (!tile) return 'Kosong';
  const crop = cropData[tile.type];
  if (!crop) return 'Kosong';
  const p = tile.progress / crop.growDays;
  if (p < 0.35) return 'Biji';
  if (p < 0.7) return 'Tumbuh';
  return 'Siap';
}

function randomWeather() {
  const list = ['Cerah', 'Hujan', 'Berawan', 'Angin'];
  return list[Math.floor(Math.random() * list.length)];
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 6);
}

function renderTopBar() {
  els.dayValue.textContent = state.day;
  els.weatherValue.textContent = state.weather;
  els.moneyValue.textContent = formatMoney(state.money);
  els.energyValue.textContent = `${state.energy} / ${state.maxEnergy}`;
  els.selectedTool.textContent = {
    hand: 'TANGAN',
    water: 'SIRAM',
    plant: 'TANAM'
  }[state.selectedTool] || 'TANGAN';
  els.marketStatus.textContent = state.marketStatus;
}

function renderSeeds() {
  const entries = Object.entries(cropData);
  els.seedPanel.innerHTML = '';

  entries.forEach(([seedId, crop]) => {
    const btn = document.createElement('button');
    btn.className = `seed-card ${state.selectedSeed === seedId ? 'selected' : ''}`;
    btn.innerHTML = `
      <span>${crop.icon}</span>
      <div>
        <strong>${crop.name}</strong>
        <small>${formatMoney(crop.price)} · ${crop.growDays} hari</small>
      </div>
    `;
    btn.addEventListener('click', () => {
      state.selectedSeed = seedId;
      render();
    });
    els.seedPanel.appendChild(btn);
  });
}

function renderInventory() {
  els.inventoryList.innerHTML = '';
  const entries = Object.entries(state.inventory);

  if (!entries.some(([, qty]) => qty > 0)) {
    els.inventoryList.innerHTML = '<div class="empty-box">Tiada benih lagi.</div>';
    return;
  }

  entries.forEach(([seedId, qty]) => {
    if (qty <= 0) return;
    const crop = cropData[seedId];
    const item = document.createElement('button');
    item.className = 'inventory-item';
    item.innerHTML = `
      <span>${crop.icon}</span>
      <div>
        <strong>${crop.name}</strong>
        <small>${qty} biji</small>
      </div>
    `;
    item.addEventListener('click', () => {
      state.selectedSeed = seedId;
      render();
    });
    els.inventoryList.appendChild(item);
  });
}

function renderVillagers() {
  els.villagerList.innerHTML = '';

  villagers.forEach((person, index) => {
    const card = document.createElement('div');
    card.className = 'villager-card';
    const active = index === state.villagerIndex;
    if (active) card.style.borderColor = 'rgba(188, 150, 62, 0.6)';

    card.innerHTML = `
      <div class="villager-main">
        <span>${person.icon}</span>
        <div>
          <span class="villager-name">${person.name}</span>
          <span class="villager-mood">${person.mood}</span>
        </div>
      </div>
      <button class="mini-btn">Sapa</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      const perk = 12 + index * 5;
      state.money += perk;
      addLog(`${person.name} berkata: "Terima kasih, ladang anda makin cantik!"`);
      state.marketStatus = `${person.name} memberi sokongan padang. +RM ${perk.toFixed(2)}.`;
      showToast(`${person.name} menyokong anda! +${formatMoney(perk)}`);
      render();
    });

    els.villagerList.appendChild(card);
  });
}

function renderLog() {
  els.logList.innerHTML = '';
  state.log.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry;
    els.logList.appendChild(li);
  });
}

function renderFarm() {
  els.farmGrid.innerHTML = '';

  state.farm.forEach((tile, index) => {
    const button = document.createElement('button');
    button.className = `farm-tile ${tile ? '' : 'empty'}`;
    if (tile) {
      if (tile.watered) button.classList.add('watered');
      const crop = cropData[tile.type];
      button.style.background = `linear-gradient(180deg, ${crop.color}, ${crop.id === 'labu' ? '#c59436' : '#7fa264'} 60%, #567b4e)`;
      const progress = Math.min((tile.progress / crop.growDays) * 100, 100);
      button.innerHTML = `
        <span class="plant-icon">${crop.icon}</span>
        <span class="plant-tag">${getCropStage(tile)}</span>
        <span class="plant-progress"><span style="width:${progress}%"></span></span>
      `;
    } else {
      button.innerHTML = '<span class="tile-empty">＋</span>';
    }

    button.addEventListener('click', () => handleTileClick(index));
    els.farmGrid.appendChild(button);
  });
}

function render() {
  renderTopBar();
  renderSeeds();
  renderInventory();
  renderVillagers();
  renderLog();
  renderFarm();
  saveState();
}

function setTool(tool) {
  state.selectedTool = tool;
  renderTopBar();
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
}

function plantSeed(index, seedId) {
  if (state.energy <= 0) {
    showToast('Tenaga habis. Rehat dahulu.');
    return;
  }

  if (state.inventory[seedId] <= 0) {
    showToast('Benih tidak mencukupi.');
    return;
  }

  if (state.farm[index]) {
    showToast('Petak ini sudah ditanam.');
    return;
  }

  state.inventory[seedId] -= 1;
  state.farm[index] = {
    type: seedId,
    progress: 0,
    watered: false
  };
  state.energy -= 1;
  addLog(`${cropData[seedId].name} ditanam di petak ${index + 1}.`);
  showToast(`${cropData[seedId].name} ditanam.`);
  render();
}

function waterTile(index) {
  const tile = state.farm[index];
  if (!tile) {
    showToast('Tiada tanaman untuk disiram.');
    return;
  }

  if (state.energy <= 0) {
    showToast('Tenaga habis.');
    return;
  }

  if (tile.progress >= cropData[tile.type].growDays) {
    showToast('Tanaman sudah siap dituai.');
    return;
  }

  tile.watered = true;
  tile.progress += 1;
  state.energy -= 1;
  addLog(`${cropData[tile.type].name} disiram. Pertumbuhan bertambah.`);
  showToast('Tanaman disiram.');
  render();
}

function harvestTile(index) {
  const tile = state.farm[index];
  if (!tile) {
    showToast('Tiada tanaman di sini.');
    return;
  }

  const crop = cropData[tile.type];
  if (tile.progress < crop.growDays) {
    showToast('Belum masak lagi.');
    return;
  }

  const bonus = tile.watered ? 1.25 : 1;
  const gain = Math.round(crop.price * bonus);
  state.money += gain;
  state.farm[index] = null;
  state.energy -= 1;
  addLog(`${crop.name} dituai. Pendapatan +${formatMoney(gain)}.`);
  state.marketStatus = `Tuai berjaya: ${crop.name} memberi ${formatMoney(gain)}.`;
  showToast(`Tuai ${crop.name}! +${formatMoney(gain)}`);
  render();
}

function handleTileClick(index) {
  if (state.selectedTool === 'hand') {
    harvestTile(index);
    return;
  }

  if (state.selectedTool === 'water') {
    waterTile(index);
    return;
  }

  if (state.selectedTool === 'plant') {
    plantSeed(index, state.selectedSeed);
  }
}

function buySeed() {
  const selected = state.selectedSeed;
  const crop = cropData[selected];

  if (state.money < crop.price) {
    showToast('Wang tidak mencukupi.');
    return;
  }

  state.money -= crop.price;
  state.inventory[selected] += 1;
  addLog(`${crop.name} dibeli dari kedai. Stok bertambah.`);
  state.marketStatus = `${crop.name} dibeli. Stok sekarang bertambah.`;
  showToast(`${crop.name} dibeli.`);
  render();
}

function nextDay() {
  state.day += 1;
  state.weather = randomWeather();
  state.energy = state.maxEnergy;
  state.villagerIndex = (state.villagerIndex + 1) % villagers.length;

  state.farm.forEach((tile) => {
    if (!tile) return;
    const crop = cropData[tile.type];
    if (tile.watered) {
      tile.progress += 1.3;
      tile.watered = false;
    } else {
      tile.progress += 0.7;
    }
    if (tile.progress > crop.growDays) {
      tile.progress = crop.growDays;
    }
  });

  addLog(`Hari ${state.day}. Cuaca: ${state.weather}. Kampung mula aktif semula.`);
  state.marketStatus = `Hari ${state.day}: cuaca ${state.weather}. Tanam dan jaga ladang anda.`;
  showToast(`Hari ${state.day} dimulakan.`);
  render();
}

document.querySelectorAll('.tool-btn').forEach((btn) => {
  btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

els.buySeedBtn.addEventListener('click', buySeed);
els.nextDayBtn.addEventListener('click', nextDay);

render();

window.addEventListener('beforeunload', saveState);
