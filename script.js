// API Configuration
const HYPIXEL_API_BASE = 'https://api.hypixel.net';
const PLAYER_NAMES_API = 'https://api.mojang.com/users/profiles/minecraft';

// State Management
let apiKey = localStorage.getItem('hypixelApiKey') || '';
let playerUUID = '';

// DOM Elements
const usernameInput = document.getElementById('usernameInput');
const searchBtn = document.getElementById('searchBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const playerInfo = document.getElementById('playerInfo');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
usernameInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
saveApiKeyBtn.addEventListener('click', handleSaveApiKey);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (apiKey) {
        apiKeyStatus.textContent = '✓ API Key loaded';
        apiKeyStatus.style.color = '#51cf66';
    }
});

/**
 * Handle API Key Save
 */
function handleSaveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        showError('Please enter an API key');
        return;
    }

    localStorage.setItem('hypixelApiKey', key);
    apiKey = key;
    apiKeyInput.value = '';
    apiKeyStatus.textContent = '✓ API Key saved successfully!';
    apiKeyStatus.style.color = '#51cf66';

    setTimeout(() => {
        apiKeyStatus.textContent = '';
    }, 3000);
}

/**
 * Handle Player Search
 */
async function handleSearch() {
    const username = usernameInput.value.trim();
    if (!username) {
        showError('Please enter a username');
        return;
    }

    if (!apiKey) {
        showError('⚠️ API Key not set! Please set your Hypixel API key first.');
        return;
    }

    try {
        showLoading(true);
        hideMessages();

        // Get UUID from username
        playerUUID = await getPlayerUUID(username);
        if (!playerUUID) {
            showError('Player not found. Please check the username.');
            showLoading(false);
            return;
        }

        // Fetch player data
        const playerData = await getPlayerData(playerUUID);
        
        if (!playerData) {
            showError('Failed to fetch player data. The player may not exist on Hypixel.');
            showLoading(false);
            return;
        }

        // Display player information
        displayPlayerInfo(playerData);
        showSuccess(`Successfully loaded stats for ${username}!`);
        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An error occurred while fetching player data');
        showLoading(false);
    }
}

/**
 * Get Player UUID from Username
 */
async function getPlayerUUID(username) {
    try {
        const response = await fetch(`${PLAYER_NAMES_API}/${username}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch player UUID');
        }
        const data = await response.json();
        return data.id;
    } catch (error) {
        throw error;
    }
}

/**
 * Get Player Data from Hypixel API
 */
async function getPlayerData(uuid) {
    try {
        const response = await fetch(`${HYPIXEL_API_BASE}/player?uuid=${uuid}&key=${apiKey}`);
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Invalid API Key. Please check your Hypixel API key.');
            } else if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch player data from Hypixel');
        }

        const data = await response.json();
        if (!data.success) {
            if (data.cause === 'Unauthorized') {
                throw new Error('Invalid API Key. Please check your Hypixel API key.');
            }
            return null;
        }

        return data.player;
    } catch (error) {
        throw error;
    }
}

/**
 * Display Player Information
 */
function displayPlayerInfo(player) {
    // Player Header
    const playerName = player.displayname || 'Unknown';
    const playerLevel = getPlayerLevel(player);
    const playerRank = getPlayerRank(player);
    
    document.getElementById('playerName').textContent = `${playerRank}${playerName}`;
    document.getElementById('playerLevel').textContent = `Level: ${playerLevel}`;
    document.getElementById('playerHead').src = `https://crafatar.com/renders/head/${playerUUID}?size=120&overlay`;
    document.getElementById('playerJoinDate').textContent = `Joined: ${formatDate(player.firstLogin)}`;

    // General Stats
    document.getElementById('totalCoins').textContent = formatNumber(player.coins || 0);
    document.getElementById('achievementPoints').textContent = formatNumber(player.achievementPoints || 0);
    document.getElementById('karma').textContent = formatNumber(player.karma || 0);
    document.getElementById('firstLogin').textContent = formatDate(player.firstLogin);

    // SkyBlock Stats
    const skyblockData = player.stats?.SkyBlock || {};
    document.getElementById('skyShards').textContent = formatNumber(skyblockData.shards || 0);
    document.getElementById('skyblockPurse').textContent = formatNumber(skyblockData.purse || 0);
    document.getElementById('bankBalance').textContent = formatNumber(skyblockData.bank || 0);
    document.getElementById('skyblockProfiles').textContent = Object.keys(player.stats?.SkyBlock?.profiles || {}).length;

    // Bedwars Stats
    const bedwarsData = player.stats?.Bedwars || {};
    const bedwarsWins = bedwarsData.wins_bedwars || 0;
    const bedwarsLosses = bedwarsData.losses_bedwars || 0;
    const bedwarsRatio = bedwarsLosses > 0 ? (bedwarsWins / bedwarsLosses).toFixed(2) : bedwarsWins;
    
    document.getElementById('bedwarsWins').textContent = formatNumber(bedwarsWins);
    document.getElementById('bedwarsLosses').textContent = formatNumber(bedwarsLosses);
    document.getElementById('bedwarsRatio').textContent = bedwarsRatio;
    document.getElementById('bedwarsFinalKills').textContent = formatNumber(bedwarsData.final_kills_bedwars || 0);
    document.getElementById('bedwarsFinalDeaths').textContent = formatNumber(bedwarsData.final_deaths_bedwars || 0);
    document.getElementById('bedwarsStars').textContent = formatNumber(bedwarsData.level || 0);

    // Skywars Stats
    const skywarsData = player.stats?.SkyWars || {};
    document.getElementById('skywarsWins').textContent = formatNumber(skywarsData.wins || 0);
    document.getElementById('skywarsLosses').textContent = formatNumber(skywarsData.losses || 0);
    document.getElementById('skywarsKills').textContent = formatNumber(skywarsData.kills || 0);
    document.getElementById('skywarDeaths').textContent = formatNumber(skywarsData.deaths || 0);

    // Blitz Stats
    const blitzData = player.stats?.HungerGames || {};
    document.getElementById('blitzWins').textContent = formatNumber(blitzData.wins || 0);
    document.getElementById('blitzKills').textContent = formatNumber(blitzData.kills || 0);
    document.getElementById('blitzDeaths').textContent = formatNumber(blitzData.deaths || 0);

    // Duels Stats
    const duelsData = player.stats?.Duels || {};
    const duelsWins = duelsData.wins || 0;
    const duelsLosses = duelsData.losses || 0;
    const duelsRatio = duelsLosses > 0 ? (duelsWins / duelsLosses).toFixed(2) : duelsWins;
    
    document.getElementById('duelsWins').textContent = formatNumber(duelsWins);
    document.getElementById('duelsLosses').textContent = formatNumber(duelsLosses);
    document.getElementById('duelsRatio').textContent = duelsRatio;

    // Pit Stats
    const pitData = player.stats?.Pit || {};
    document.getElementById('pitPrestige').textContent = formatNumber(pitData.prestige || 0);
    document.getElementById('pitLevel').textContent = formatNumber(pitData.level || 0);
    document.getElementById('pitKills').textContent = formatNumber(pitData.kills || 0);
    document.getElementById('pitDeaths').textContent = formatNumber(pitData.deaths || 0);

    // Show player info section
    playerInfo.classList.remove('hidden');
    
    // Scroll to player info
    setTimeout(() => {
        playerInfo.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

/**
 * Get Player Level (based on exp)
 */
function getPlayerLevel(player) {
    const exp = player.networkExp || 0;
    // Approximate calculation based on Hypixel's leveling system
    return Math.floor(exp / 5000);
}

/**
 * Get Player Rank Badge
 */
function getPlayerRank(player) {
    const rank = player.rank || player.newPackageRank || 'NONE';
    const rankColors = {
        'YOUTUBER': '🟥 ',
        'ADMIN': '🟥 ',
        'MODERATOR': '🟩 ',
        'HELPER': '🟦 ',
        'VIP_PLUS': '🟩 ',
        'VIP': '🟩 ',
        'MVP_PLUS': '🟦 ',
        'MVP': '🟦 ',
    };
    return rankColors[rank] || '';
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Show loading spinner
 */
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
}

/**
 * Hide all messages
 */
function hideMessages() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
}
