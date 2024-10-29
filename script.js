const apiKey = '389ee0109370a9e40ca860a38cd97a6e'; // Replace with your OpenWeather API key
const searchButton = document.getElementById('search-button');
const currentLocationButton = document.getElementById('current-location-button'); // New button
const cityInput = document.getElementById('city-input');
const weatherInfo = document.getElementById('weather-info');
const errorMessage = document.getElementById('error-message');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const description = document.getElementById('description');
const weatherIcon = document.getElementById('weather-icon');
const saveFavoriteButton = document.getElementById('save-favorite-button');
const forecast = document.getElementById('forecast');
const forecastList = document.getElementById('forecast-list');
const favoritesList = document.getElementById('favorites-list');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Add event listeners
searchButton.addEventListener('click', getWeather);
currentLocationButton.addEventListener('click', getCurrentLocation); // Event for current location button
saveFavoriteButton.addEventListener('click', saveFavoriteCity);

async function getWeather() {
    const city = cityInput.value;

    if (!city) {
        alert('Please enter a city name');
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('City not found');
        }
        const data = await response.json();
        displayWeather(data);
        errorMessage.classList.add('hidden');
        fetchForecast(data.coord.lat, data.coord.lon); // Fetch forecast
    } catch (error) {
        displayError(error.message);
    }
}

// New function to get weather based on current location
async function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Weather data not found');
                }
                const data = await response.json();
                displayWeather(data);
                errorMessage.classList.add('hidden');
                fetchForecast(latitude, longitude); // Fetch forecast
            } catch (error) {
                displayError(error.message);
            }
        }, (error) => {
            console.error('Error getting location: ', error);
            displayError('Unable to retrieve your location.');
        });
    } else {
        displayError('Geolocation is not supported by this browser.');
    }
}


async function fetchForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Forecast not found');
        }
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        displayError(error.message);
    }
}

function displayWeather(data) {
    cityName.innerText = `${data.name}, ${data.sys.country}`;
    temperature.innerText = `Temperature: ${data.main.temp} °C`;
    humidity.innerText = `Humidity: ${data.main.humidity}%`;
    description.innerText = `Condition: ${data.weather[0].description}`;
    weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    weatherInfo.classList.remove('hidden');
    saveFavoriteButton.classList.remove('hidden');
}

function displayForecast(data) {
    forecast.classList.remove('hidden');
    forecastList.innerHTML = ''; // Clear previous forecast

    data.list.forEach((item, index) => {
        if (index % 8 === 0) { // Only show one forecast per day
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';

            const date = new Date(item.dt_txt).toLocaleDateString();
            const icon = item.weather[0].icon;
            const temp = Math.round(item.main.temp);
            const windSpeed = item.wind.speed;
            const humidity = item.main.humidity;
            const precipitation = item.rain ? item.rain['1h'] : 0;

            forecastItem.innerHTML = `
                <p class="forecast-date">${date}</p>
                <img src="http://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon" class="forecast-icon">
                <p class="forecast-temp">${temp} °C</p>
                <p class="forecast-wind">Wind Speed: ${windSpeed} m/s</p>
                <p class="forecast-humidity">Humidity: ${humidity}%</p>
                <p class="forecast-precipitation">Precipitation: ${precipitation} mm</p>
            `;

            forecastList.appendChild(forecastItem);
        }
    });
}

function saveFavoriteCity() {
    const city = cityInput.value;
    const iconUrl = weatherIcon.src; // Get the current weather icon URL

    if (!city) return;

    const favorite = { location: city, icon: iconUrl }; // Create a favorite object

    if (!favorites.some(fav => fav.location === city)) { // Check for duplicates
        favorites.push(favorite);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    } else {
        alert('This city is already in your favorites!');
    }
}

function renderFavorites() {
    favoritesList.innerHTML = ''; // Clear previous favorites
    favorites.forEach((favorite, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${favorite.icon}" alt="Weather Icon" class="favorite-icon" onerror="this.onerror=null; this.src='path/to/default/icon.png';">
            <span class="favorite-location">${favorite.location}</span>
            <button class="remove-favorite" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        favoritesList.appendChild(li);
    });

    // Add event delegation for remove buttons
    favoritesList.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', (event) => {
            const index = event.target.parentElement.getAttribute('data-index');
            favorites.splice(index, 1); // Remove from array
            localStorage.setItem('favorites', JSON.stringify(favorites)); // Update local storage
            renderFavorites(); // Re-render favorites
        });
    });
}

// Display error messages
function displayError(message) {
    errorMessage.innerText = message;
    errorMessage.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    forecast.classList.add('hidden');
}

window.onload = renderFavorites; // Render favorites on load
