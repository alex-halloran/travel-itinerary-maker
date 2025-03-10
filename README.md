# Travel Itinerary Maker

A web application inspired by Rexby.com that allows users to create travel itineraries using Google Maps integration.

## Features

- **Google Maps Integration**: Search for destinations and points of interest
- **Itinerary Creation**: Create day-by-day travel plans
- **Place Management**: Add, remove, and reorder places in your itinerary
- **Save Functionality**: Store itineraries locally
- **Time Planning**: Add time slots for each activity
- **Multiple Itineraries**: Create and manage multiple trip plans

## Usage Instructions

### Getting Started

1. **Get a Google Maps API Key**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to APIs & Services > Library
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
   - Navigate to APIs & Services > Credentials
   - Create an API key and restrict it to your domains for security
   - Make sure you have billing set up (required for the Places API)

2. **Set Up the Application**
   - Clone this repository
   - Open `index.html` in a text editor
   - Replace `YOUR_API_KEY` in the Google Maps script tag with your actual API key
   - Open the file in a web browser or host it on a web server

### Creating an Itinerary

1. **Set Trip Details**
   - Enter a title for your trip
   - Select start and end dates for your journey

2. **Search for Places**
   - Use the search box to find destinations, attractions, restaurants, etc.
   - Click on a place marker on the map to see details

3. **Add Places to Your Itinerary**
   - From the place details panel, select which day to add the place to
   - Click "Add to Itinerary" to include it in your plan

4. **Organize Your Schedule**
   - Set approximate times for each activity
   - Reorder places using the up and down arrow buttons
   - Remove unwanted places with the trash icon

5. **Save Your Itinerary**
   - Click the "Save Itinerary" button to store your plan locally
   - Access your saved itineraries by clicking "My Itineraries"

## Implementation Details

- The application uses the latest version of the Google Maps JavaScript API
- Google Places API v3 is used for place search, autocomplete, and details functionality
- Local storage is used to save itineraries in the browser
- No server-side components are required to run the basic application

## Google Places API Updates

This application has been updated to use the latest version of the Google Places API. Key changes include:

- Updated script loading format with the new libraries parameter
- Added the Autocomplete service for improved search functionality
- Using the TextSearch method for manual searches
- More detailed place data retrieval with expanded fields
- Improved error handling for API-related issues

## Troubleshooting Common Issues

- **API Key Errors**: Make sure your API key is correctly entered and has the necessary APIs enabled
- **"API Not Activated" Error**: You must enable the Places API and Maps JavaScript API in Google Cloud Console
- **Billing Required**: Google Maps Platform requires billing to be set up (includes $200 monthly free credit)
- **CORS Issues**: When testing locally, you might need to use a simple web server

## Future Enhancements

- User accounts with cloud-based storage
- Sharing itineraries with other users
- Exporting itineraries to PDF or calendar formats
- Travel time estimates between places
- Budget tracking functionality
- Weather forecast integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Inspired by Rexby.com travel planning platform
- Built with Google Maps Platform
