// **NOTE**: Replace 'YOUR_API_KEY' with your actual NASA API key.
// You can get a free key from https://api.nasa.gov/
const API_KEY = 'DEMO_KEY'; // Using DEMO_KEY for initial testing
const BASE_URL = 'https://api.nasa.gov/planetary/apod';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const imageContainer = document.getElementById('current-image-container');
const searchHistoryList = document.getElementById('search-history');

// Helper function to format the date to YYYY-MM-DD
function getFormattedDate(date) {
    if (date instanceof Date) {
        return date.toISOString().split("T")[0];
    }
    // Assumes date is already in YYYY-MM-DD string format if not a Date object
    return date; 
}

// ----------------------------------------------------
// 1. Fetching Functions
// ----------------------------------------------------

/**
 * Fetches the Astronomy Picture of the Day for a given date.
 * @param {string} date - Date in 'YYYY-MM-DD' format.
 */
async function getImageOfTheDay(date) {
    // Clear previous content and show loading
    imageContainer.innerHTML = '<h2>Loading Image...</h2><p>Fetching data for ' + date + '...</p>';
    
    // Check if a date is provided, otherwise use the current date (for safety)
    const dateToFetch = date || getFormattedDate(new Date());

    const url = `${BASE_URL}?api_key=${API_KEY}&date=${dateToFetch}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Check for specific API error (e.g., date out of range)
            const errorData = await response.json();
            throw new Error(errorData.msg || `HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Save to history only if a specific date was searched via the form/history click
        // and it's not the initial current date load
        if (date) {
            saveSearch(dateToFetch);
        }
        
        // Display the results
        displayImage(data);

    } catch (error) {
        console.error('Error fetching data:', error);
        imageContainer.innerHTML = `<h2>Error 😥</h2><p>Could not load the image for ${dateToFetch}.</p><p>Details: ${error.message}</p>`;
    }
}

/**
 * Fetches and displays the image for the current date.
 * This function runs when the page loads.
 */
function getCurrentImageOfTheDay() {
    const currentDate = getFormattedDate(new Date());
    // Call the main function, passing no date so it uses the current one by default
    // We pass the current date explicitly here just to be clear and ensure it doesn't trigger saveSearch logic.
    getImageOfTheDay(currentDate); 
}


// ----------------------------------------------------
// 2. UI Rendering Functions
// ----------------------------------------------------

/**
 * Renders the fetched APOD data (Image or Video) in the UI.
 * @param {object} data - The JSON response from the NASA APOD API.
 */
function displayImage(data) {
    let mediaElement;
    
    // Check if the media is a video (media_type === 'video') or an image
    if (data.media_type === 'video') {
        // Create an iframe for the video
        mediaElement = `
            <iframe 
                width="100%" 
                height="450" 
                src="${data.url}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else {
        // Create an image tag
        mediaElement = `<img src="${data.url}" alt="${data.title}">`;
    }

    // Update the container's content
    imageContainer.innerHTML = `
        <h2>${data.title}</h2>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Copyright:</strong> ${data.copyright || 'Public Domain'}</p>
        ${mediaElement}
        <div class="description">
            <h3>Explanation</h3>
            <p>${data.explanation}</p>
        </div>
    `;
}

/**
 * Adds the search history from local storage to the UI list.
 */
function addSearchToHistory() {
    const searches = JSON.parse(localStorage.getItem('nasaSearches')) || [];
    searchHistoryList.innerHTML = ''; // Clear existing list

    // Iterate through the array in reverse to show the most recent first
    searches.slice().reverse().forEach(date => {
        const listItem = document.createElement('li');
        listItem.textContent = date;
        listItem.dataset.date = date; // Store the date for easy retrieval
        
        // Add a click listener to refetch the image for that date
        listItem.addEventListener('click', (event) => {
            const dateToSearch = event.target.dataset.date;
            // Get the image again when a history item is clicked
            getImageOfTheDay(dateToSearch); 
        });

        searchHistoryList.appendChild(listItem);
    });
}


// ----------------------------------------------------
// 3. Local Storage Functions
// ----------------------------------------------------

/**
 * Saves a date to local storage, ensuring no duplicates.
 * Then calls addSearchToHistory to update the UI.
 * @param {string} date - Date in 'YYYY-MM-DD' format.
 */
function saveSearch(date) {
    const searches = JSON.parse(localStorage.getItem('nasaSearches')) || [];
    
    // 1. Prevent saving duplicates
    if (searches.includes(date)) {
        // If it exists, remove it and push it to the end to make it the most recent
        const index = searches.indexOf(date);
        searches.splice(index, 1);
    }
    
    // 2. Add the new (or re-added) date
    searches.push(date);
    
    // Optional: Keep history to a reasonable size (e.g., last 10 searches)
    const maxHistorySize = 10;
    if (searches.length > maxHistorySize) {
        searches.shift(); // Remove the oldest item (first element)
    }

    // 3. Save the updated array back to local storage
    localStorage.setItem('nasaSearches', JSON.stringify(searches));
    
    // 4. Update the UI list
    addSearchToHistory();
}

// ----------------------------------------------------
// 4. Event Listeners & Initialization
// ----------------------------------------------------

// Handle form submission
searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Stop the form from submitting normally (reloading the page)
    
    const selectedDate = searchInput.value;
    
    if (selectedDate) {
        // Fetch image for the selected date, which will also save the search
        getImageOfTheDay(selectedDate);
    }
});

// Run when the page first loads
window.onload = () => {
    // 1. Display the current image of the day
    getCurrentImageOfTheDay(); 
    
    // 2. Load and display the past searches from local storage
    addSearchToHistory(); 
};