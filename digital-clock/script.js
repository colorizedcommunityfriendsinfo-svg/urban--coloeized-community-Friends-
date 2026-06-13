// Timezone data with flags
const timezones = {
    'America/New_York': { name: 'New York', flag: '🇺🇸', offset: -5 },
    'America/Chicago': { name: 'Chicago', flag: '🇺🇸', offset: -6 },
    'America/Denver': { name: 'Denver', flag: '🇺🇸', offset: -7 },
    'America/Los_Angeles': { name: 'Los Angeles', flag: '🇺🇸', offset: -8 },
    'Europe/London': { name: 'London', flag: '🇬🇧', offset: 0 },
    'Europe/Paris': { name: 'Paris', flag: '🇫🇷', offset: 1 },
    'Europe/Berlin': { name: 'Berlin', flag: '🇩🇪', offset: 1 },
    'Europe/Moscow': { name: 'Moscow', flag: '🇷🇺', offset: 3 },
    'Asia/Dubai': { name: 'Dubai', flag: '🇦🇪', offset: 4 },
    'Asia/Kolkata': { name: 'India', flag: '🇮🇳', offset: 5.5 },
    'Asia/Bangkok': { name: 'Bangkok', flag: '🇹🇭', offset: 7 },
    'Asia/Hong_Kong': { name: 'Hong Kong', flag: '🇭🇰', offset: 8 },
    'Asia/Singapore': { name: 'Singapore', flag: '🇸🇬', offset: 8 },
    'Asia/Tokyo': { name: 'Tokyo', flag: '🇯🇵', offset: 9 },
    'Australia/Sydney': { name: 'Sydney', flag: '🇦🇺', offset: 10 },
    'Pacific/Auckland': { name: 'Auckland', flag: '🇳🇿', offset: 12 },
};

const defaultTimezones = [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney'
];

let currentTimezones = [...defaultTimezones];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedTimezones = localStorage.getItem('selectedTimezones');
    if (savedTimezones) {
        currentTimezones = JSON.parse(savedTimezones);
    }

    renderClocks();
    updateClocks();
    setInterval(updateClocks, 1000);

    // Event listeners
    document.getElementById('addBtn').addEventListener('click', handleAddTimezone);
    document.getElementById('resetBtn').addEventListener('click', handleReset);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

// Update all clocks
function updateClocks() {
    const clockCards = document.querySelectorAll('.clock-card');
    clockCards.forEach(card => {
        const timezone = card.dataset.timezone;
        const time = getTimeInTimezone(timezone);
        const timeElement = card.querySelector('.digital-time');
        const dateElement = card.querySelector('.timezone-date');

        timeElement.textContent = time.formattedTime;
        dateElement.textContent = time.formattedDate;
    });
}

// Get time in specific timezone
function getTimeInTimezone(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const formattedTime = formatter.format(now);
    const formattedDate = dateFormatter.format(now);

    return { formattedTime, formattedDate };
}

// Render clock cards
function renderClocks() {
    const clockGrid = document.getElementById('clockGrid');
    clockGrid.innerHTML = '';

    currentTimezones.forEach(timezone => {
        const tzData = timezones[timezone];
        if (!tzData) return;

        const time = getTimeInTimezone(timezone);
        const card = document.createElement('div');
        card.className = 'clock-card';
        card.dataset.timezone = timezone;

        card.innerHTML = `
            <div class="timezone-name">
                <span>${tzData.flag} ${tzData.name}</span>
                <button class="remove-btn" onclick="removeTimezone('${timezone}')">Remove</button>
            </div>
            <div class="timezone-info">
                UTC ${tzData.offset > 0 ? '+' : ''}${tzData.offset}
            </div>
            <div class="digital-time">${time.formattedTime}</div>
            <div class="timezone-date">${time.formattedDate}</div>
        `;

        clockGrid.appendChild(card);
    });
}

// Add timezone
function handleAddTimezone() {
    const input = document.getElementById('searchInput');
    const timezone = input.value.trim();

    if (!timezone) {
        alert('Please enter a timezone');
        return;
    }

    const matchingTz = Object.keys(timezones).find(tz =>
        tz.toLowerCase().includes(timezone.toLowerCase()) ||
        timezones[tz].name.toLowerCase().includes(timezone.toLowerCase())
    );

    if (matchingTz && !currentTimezones.includes(matchingTz)) {
        currentTimezones.push(matchingTz);
        saveTimezones();
        renderClocks();
        input.value = '';
        document.getElementById('suggestions').classList.add('hidden');
    } else if (matchingTz) {
        alert('This timezone is already added');
    } else {
        alert('Timezone not found');
    }
}

// Remove timezone
function removeTimezone(timezone) {
    currentTimezones = currentTimezones.filter(tz => tz !== timezone);
    saveTimezones();
    renderClocks();
}

// Reset to default
function handleReset() {
    currentTimezones = [...defaultTimezones];
    saveTimezones();
    renderClocks();
    document.getElementById('searchInput').value = '';
}

// Handle search/autocomplete
function handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    const suggestionsDiv = document.getElementById('suggestions');

    if (!query) {
        suggestionsDiv.classList.add('hidden');
        return;
    }

    const matches = Object.entries(timezones).filter(([tz, data]) =>
        tz.toLowerCase().includes(query) ||
        data.name.toLowerCase().includes(query)
    ).slice(0, 5);

    if (matches.length === 0) {
        suggestionsDiv.classList.add('hidden');
        return;
    }

    suggestionsDiv.innerHTML = matches
        .map(([tz, data]) => `
            <div class="suggestion-item" onclick="selectSuggestion('${tz}', '${data.name}')">
                ${data.flag} ${data.name} (${tz})
            </div>
        `)
        .join('');

    suggestionsDiv.classList.remove('hidden');
}

// Select suggestion
function selectSuggestion(timezone, name) {
    if (!currentTimezones.includes(timezone)) {
        currentTimezones.push(timezone);
        saveTimezones();
        renderClocks();
    }
    document.getElementById('searchInput').value = '';
    document.getElementById('suggestions').classList.add('hidden');
}

// Save timezones to localStorage
function saveTimezones() {
    localStorage.setItem('selectedTimezones', JSON.stringify(currentTimezones));
}
