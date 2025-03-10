// Global variables
let map;
let placesService;
let geocoder;
let markers = [];
let currentPlace = null;
let currentItinerary = {
    id: generateUniqueId(),
    title: 'My Awesome Trip',
    startDate: null,
    endDate: null,
    days: []
};

// Initialize the map
function initMap() {
    // Default location (New York City)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    
    // Create the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
    });
    
    // Initialize places service and geocoder
    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();
    
    // Initialize the search box
    const searchInput = document.getElementById('place-search');
    const searchBox = new google.maps.places.SearchBox(searchInput);
    
    // Bias the SearchBox results towards current map's viewport
    map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
    });
    
    // Listen for the event fired when the user selects a prediction
    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        
        if (places.length === 0) {
            return;
        }
        
        // Clear old markers
        clearMarkers();
        
        // For each place, get the icon, name and location
        const bounds = new google.maps.LatLngBounds();
        
        places.forEach(place => {
            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry");
                return;
            }
            
            // Create a marker for each place
            addMarker(place);
            
            if (place.geometry.viewport) {
                // Only geocodes have viewport
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        
        map.fitBounds(bounds);
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Set today's date for the date inputs
    const today = new Date();
    const todayFormatted = formatDate(today);
    document.getElementById('start-date').value = todayFormatted;
    
    // Set end date to a week later by default
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    document.getElementById('end-date').value = formatDate(nextWeek);
    
    // Update the current itinerary dates
    currentItinerary.startDate = todayFormatted;
    currentItinerary.endDate = formatDate(nextWeek);
    
    // Initialize days based on date range
    updateDays();
    
    // Load saved itineraries
    loadSavedItineraries();
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display (Month Day, Year)
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Generate a unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Set up event listeners
function setupEventListeners() {
    // Itinerary title change
    document.getElementById('itinerary-title').addEventListener('change', function() {
        currentItinerary.title = this.value;
    });
    
    // Date changes
    document.getElementById('start-date').addEventListener('change', function() {
        currentItinerary.startDate = this.value;
        updateDays();
    });
    
    document.getElementById('end-date').addEventListener('change', function() {
        currentItinerary.endDate = this.value;
        updateDays();
    });
    
    // Search button click
    document.getElementById('search-btn').addEventListener('click', function() {
        const searchInput = document.getElementById('place-search');
        if (searchInput.value.trim() !== '') {
            searchPlaces(searchInput.value);
        }
    });
    
    // Place search on enter key
    document.getElementById('place-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            searchPlaces(this.value);
        }
    });
    
    // Close place details
    document.getElementById('close-details').addEventListener('click', function() {
        document.getElementById('place-details').classList.add('hidden');
        currentPlace = null;
    });
    
    // Add place to itinerary
    document.getElementById('add-to-itinerary').addEventListener('click', function() {
        const daySelector = document.getElementById('day-selector');
        if (daySelector.value && currentPlace) {
            addPlaceToDay(currentPlace, daySelector.value);
            document.getElementById('place-details').classList.add('hidden');
        } else {
            alert('Please select a day first.');
        }
    });
    
    // Save itinerary
    document.getElementById('save-itinerary').addEventListener('click', saveItinerary);
    
    // New itinerary button
    document.getElementById('new-itinerary-btn').addEventListener('click', function() {
        document.getElementById('itinerary-modal').classList.remove('hidden');
    });
    
    // Close modal
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('itinerary-modal').classList.add('hidden');
    });
    
    // Create new itinerary from modal
    document.getElementById('create-new-itinerary').addEventListener('click', function() {
        resetItinerary();
        document.getElementById('itinerary-modal').classList.add('hidden');
    });
    
    // Share itinerary button
    document.getElementById('share-itinerary').addEventListener('click', function() {
        // Implement sharing functionality (could be a link or export)
        alert('Sharing functionality would be implemented here. For now, you can save your itinerary locally.');
    });
    
    // Event delegation for dynamic elements
    document.addEventListener('click', function(e) {
        // Handle place item actions (move up, move down, remove)
        if (e.target.closest('.move-up')) {
            const placeItem = e.target.closest('.place-item');
            moveItemUp(placeItem);
        } else if (e.target.closest('.move-down')) {
            const placeItem = e.target.closest('.place-item');
            moveItemDown(placeItem);
        } else if (e.target.closest('.remove-place')) {
            const placeItem = e.target.closest('.place-item');
            removePlaceItem(placeItem);
        } else if (e.target.closest('.load-itinerary')) {
            const itineraryItem = e.target.closest('.saved-itinerary-item');
            loadItinerary(itineraryItem.dataset.id);
            document.getElementById('itinerary-modal').classList.add('hidden');
        } else if (e.target.closest('.delete-itinerary')) {
            const itineraryItem = e.target.closest('.saved-itinerary-item');
            deleteItinerary(itineraryItem.dataset.id);
        }
    });
}

// Update days based on date range
function updateDays() {
    const startDate = new Date(currentItinerary.startDate);
    const endDate = new Date(currentItinerary.endDate);
    
    // Calculate the number of days
    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    // Clear previous days
    const daysContainer = document.getElementById('itinerary-days');
    daysContainer.innerHTML = '';
    
    // Update the day selector in the place details
    const daySelector = document.getElementById('day-selector');
    daySelector.innerHTML = '<option value="">Select day...</option>';
    
    // Create new days array for the itinerary
    currentItinerary.days = [];
    
    for (let i = 0; i < dayCount; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        const dayDateFormatted = formatDate(dayDate);
        
        // Add day to the itinerary data
        currentItinerary.days.push({
            day: i + 1,
            date: dayDateFormatted,
            places: []
        });
        
        // Create day element from template
        const template = document.getElementById('day-template');
        const dayElement = document.importNode(template.content, true);
        
        const dayItem = dayElement.querySelector('.day-item');
        dayItem.dataset.day = i + 1;
        
        const dayNumber = dayElement.querySelector('.day-number');
        dayNumber.textContent = i + 1;
        
        const dayDateElement = dayElement.querySelector('.day-date');
        dayDateElement.textContent = formatDateForDisplay(dayDateFormatted);
        
        // Add the day to the container
        daysContainer.appendChild(dayElement);
        
        // Add option to day selector
        const option = document.createElement('option');
        option.value = i + 1;
        option.textContent = `Day ${i + 1} - ${formatDateForDisplay(dayDateFormatted)}`;
        daySelector.appendChild(option);
    }
}

// Search for places
function searchPlaces(query) {
    const request = {
        query: query,
        fields: ['name', 'geometry', 'place_id', 'formatted_address', 'rating', 'user_ratings_total', 'photos']
    };
    
    placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Clear previous markers
            clearMarkers();
            
            // Create bounds for the map
            const bounds = new google.maps.LatLngBounds();
            
            // Add markers for each result
            results.forEach(place => {
                addMarker(place);
                bounds.extend(place.geometry.location);
            });
            
            // Fit the map to the bounds
            map.fitBounds(bounds);
            
            // If only one result, show its details
            if (results.length === 1) {
                showPlaceDetails(results[0]);
            }
        } else {
            alert('No places found for that query. Please try again.');
        }
    });
}

// Add a marker to the map
function addMarker(place) {
    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        animation: google.maps.Animation.DROP,
    });
    
    // Add click event to show place details
    marker.addListener('click', () => {
        showPlaceDetails(place);
    });
    
    // Add marker to the markers array
    markers.push(marker);
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Show place details
function showPlaceDetails(place) {
    // Store the current place
    currentPlace = place;
    
    // Set place details
    document.getElementById('place-name').textContent = place.name;
    document.getElementById('place-address').textContent = place.formatted_address || '';
    
    // Set rating and reviews
    if (place.rating) {
        document.getElementById('place-rating').textContent = place.rating.toFixed(1);
        document.getElementById('review-count').textContent = `(${place.user_ratings_total || 0} reviews)`;
        
        // Update stars
        const stars = document.querySelectorAll('.stars i');
        stars.forEach((star, index) => {
            if (index < Math.floor(place.rating)) {
                star.className = 'fas fa-star';
            } else if (index === Math.floor(place.rating) && place.rating % 1 >= 0.5) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
        });
    } else {
        document.getElementById('place-rating').textContent = 'N/A';
        document.getElementById('review-count').textContent = '(No reviews)';
    }
    
    // Show the place details
    document.getElementById('place-details').classList.remove('hidden');
}

// Add place to a specific day
function addPlaceToDay(place, dayNumber) {
    // Find the day in the itinerary
    const dayIndex = currentItinerary.days.findIndex(day => day.day == dayNumber);
    
    if (dayIndex === -1) {
        console.error('Day not found:', dayNumber);
        return;
    }
    
    // Create place object
    const placeObj = {
        id: generateUniqueId(),
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        },
        time: ''
    };
    
    // Add place to the day
    currentItinerary.days[dayIndex].places.push(placeObj);
    
    // Create place element
    addPlaceElementToDay(placeObj, dayNumber);
}

// Add place element to day
function addPlaceElementToDay(place, dayNumber) {
    // Get the places container for the day
    const dayElement = document.querySelector(`.day-item[data-day="${dayNumber}"]`);
    const placesList = dayElement.querySelector('.places-list');
    
    // Create place element from template
    const template = document.getElementById('place-item-template');
    const placeElement = document.importNode(template.content, true);
    
    const placeItem = placeElement.querySelector('.place-item');
    placeItem.dataset.placeId = place.id;
    
    const placeTitle = placeElement.querySelector('.place-title');
    placeTitle.textContent = place.name;
    
    const placeAddress = placeElement.querySelector('.place-address');
    placeAddress.textContent = place.address;
    
    const timeInput = placeElement.querySelector('.time-input');
    timeInput.value = place.time;
    timeInput.addEventListener('change', function() {
        updatePlaceTime(place.id, this.value);
    });
    
    // Add the place to the container
    placesList.appendChild(placeElement);
}

// Update place time
function updatePlaceTime(placeId, time) {
    // Find the place in the itinerary
    for (const day of currentItinerary.days) {
        const placeIndex = day.places.findIndex(place => place.id === placeId);
        if (placeIndex !== -1) {
            day.places[placeIndex].time = time;
            break;
        }
    }
}

// Move item up in the list
function moveItemUp(placeItem) {
    const prevSibling = placeItem.previousElementSibling;
    if (prevSibling) {
        placeItem.parentNode.insertBefore(placeItem, prevSibling);
        updatePlacesOrder(placeItem.closest('.day-item'));
    }
}

// Move item down in the list
function moveItemDown(placeItem) {
    const nextSibling = placeItem.nextElementSibling;
    if (nextSibling) {
        placeItem.parentNode.insertBefore(nextSibling, placeItem);
        updatePlacesOrder(placeItem.closest('.day-item'));
    }
}

// Remove place item
function removePlaceItem(placeItem) {
    const placeId = placeItem.dataset.placeId;
    const dayItem = placeItem.closest('.day-item');
    const dayNumber = dayItem.dataset.day;
    
    // Remove from UI
    placeItem.remove();
    
    // Remove from data
    const dayIndex = currentItinerary.days.findIndex(day => day.day == dayNumber);
    if (dayIndex !== -1) {
        const placeIndex = currentItinerary.days[dayIndex].places.findIndex(place => place.id === placeId);
        if (placeIndex !== -1) {
            currentItinerary.days[dayIndex].places.splice(placeIndex, 1);
        }
    }
}

// Update places order after drag and drop
function updatePlacesOrder(dayItem) {
    const dayNumber = dayItem.dataset.day;
    const dayIndex = currentItinerary.days.findIndex(day => day.day == dayNumber);
    
    if (dayIndex === -1) return;
    
    // Get all place items in the correct order
    const placeItems = dayItem.querySelectorAll('.place-item');
    const newPlacesOrder = [];
    
    placeItems.forEach(item => {
        const placeId = item.dataset.placeId;
        const place = currentItinerary.days[dayIndex].places.find(p => p.id === placeId);
        if (place) {
            newPlacesOrder.push(place);
        }
    });
    
    // Update the places array for the day
    currentItinerary.days[dayIndex].places = newPlacesOrder;
}

// Save the current itinerary
function saveItinerary() {
    // Get saved itineraries from local storage
    let savedItineraries = JSON.parse(localStorage.getItem('itineraries')) || [];
    
    // Check if this itinerary already exists
    const existingIndex = savedItineraries.findIndex(itinerary => itinerary.id === currentItinerary.id);
    
    if (existingIndex !== -1) {
        // Update existing itinerary
        savedItineraries[existingIndex] = currentItinerary;
    } else {
        // Add new itinerary
        savedItineraries.push(currentItinerary);
    }
    
    // Save to local storage
    localStorage.setItem('itineraries', JSON.stringify(savedItineraries));
    
    // Update the saved itineraries list
    loadSavedItineraries();
    
    alert('Itinerary saved successfully!');
}

// Load saved itineraries
function loadSavedItineraries() {
    const savedItinerariesContainer = document.getElementById('saved-itineraries');
    savedItinerariesContainer.innerHTML = '';
    
    // Get saved itineraries from local storage
    const savedItineraries = JSON.parse(localStorage.getItem('itineraries')) || [];
    
    if (savedItineraries.length === 0) {
        savedItinerariesContainer.innerHTML = '<p class="no-itineraries">You don\'t have any saved itineraries yet.</p>';
        return;
    }
    
    // Create elements for each itinerary
    savedItineraries.forEach(itinerary => {
        const template = document.getElementById('saved-itinerary-template');
        const itineraryElement = document.importNode(template.content, true);
        
        const itineraryItem = itineraryElement.querySelector('.saved-itinerary-item');
        itineraryItem.dataset.id = itinerary.id;
        
        const itineraryName = itineraryElement.querySelector('.itinerary-name');
        itineraryName.textContent = itinerary.title;
        
        const itineraryDates = itineraryElement.querySelector('.itinerary-dates');
        itineraryDates.textContent = `${formatDateForDisplay(itinerary.startDate)} - ${formatDateForDisplay(itinerary.endDate)}`;
        
        const placeCount = itineraryElement.querySelector('.place-count');
        const totalPlaces = itinerary.days.reduce((total, day) => total + day.places.length, 0);
        placeCount.textContent = totalPlaces;
        
        savedItinerariesContainer.appendChild(itineraryElement);
    });
}

// Load a specific itinerary
function loadItinerary(itineraryId) {
    // Get saved itineraries from local storage
    const savedItineraries = JSON.parse(localStorage.getItem('itineraries')) || [];
    
    // Find the itinerary
    const itinerary = savedItineraries.find(item => item.id === itineraryId);
    
    if (!itinerary) {
        alert('Itinerary not found!');
        return;
    }
    
    // Set current itinerary
    currentItinerary = itinerary;
    
    // Update UI
    document.getElementById('itinerary-title').value = itinerary.title;
    document.getElementById('start-date').value = itinerary.startDate;
    document.getElementById('end-date').value = itinerary.endDate;
    
    // Update days
    updateDays();
    
    // Add places to days
    itinerary.days.forEach(day => {
        day.places.forEach(place => {
            addPlaceElementToDay(place, day.day);
        });
    });
    
    // Add markers to the map
    clearMarkers();
    const bounds = new google.maps.LatLngBounds();
    
    // Add markers for all places in the itinerary
    itinerary.days.forEach(day => {
        day.places.forEach(place => {
            const location = place.location;
            const marker = new google.maps.Marker({
                position: { lat: location.lat, lng: location.lng },
                map: map,
                title: place.name
            });
            
            markers.push(marker);
            bounds.extend(new google.maps.LatLng(location.lat, location.lng));
        });
    });
    
    // Fit map to bounds if there are places
    if (markers.length > 0) {
        map.fitBounds(bounds);
    }
}

// Delete a saved itinerary
function deleteItinerary(itineraryId) {
    if (!confirm('Are you sure you want to delete this itinerary?')) {
        return;
    }
    
    // Get saved itineraries from local storage
    let savedItineraries = JSON.parse(localStorage.getItem('itineraries')) || [];
    
    // Filter out the itinerary to delete
    savedItineraries = savedItineraries.filter(itinerary => itinerary.id !== itineraryId);
    
    // Save back to local storage
    localStorage.setItem('itineraries', JSON.stringify(savedItineraries));
    
    // Update the saved itineraries list
    loadSavedItineraries();
}

// Reset to a new itinerary
function resetItinerary() {
    currentItinerary = {
        id: generateUniqueId(),
        title: 'My Awesome Trip',
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
        days: []
    };
    
    document.getElementById('itinerary-title').value = currentItinerary.title;
    
    // Update days
    updateDays();
    
    // Clear markers
    clearMarkers();
}

// Function to add a custom control to the map
function addCustomMapControl(controlDiv, map, text, title, callback) {
    // Set CSS for the control border.
    const controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginTop = '10px';
    controlUI.style.marginRight = '10px';
    controlUI.style.textAlign = 'center';
    controlUI.title = title;
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    const controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = text;
    controlUI.appendChild(controlText);

    // Setup the click event listener
    controlUI.addEventListener('click', callback);
}
