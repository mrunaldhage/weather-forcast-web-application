const userLocation = document.getElementById("userLocation"),
      converter = document.getElementById("converter"),
      weatherIcon = document.querySelector(".weatherIcon"),
      temperature = document.querySelector(".temperature"),
      feelsLike = document.querySelector(".feelsLike"),
      description = document.querySelector(".description"),
      date = document.querySelector(".date"),
      city = document.querySelector(".city"),

      HValue = document.getElementById("HValue"),
      WValue = document.getElementById("WValue"),
      SRValue = document.getElementById("SRValue"),
      SSValue = document.getElementById("SSValue"),
      CValue = document.getElementById("CValue"),
      UVValue = document.getElementById("UVValue"),
      PValue = document.getElementById("PValue"),

      Forecast = document.querySelector(".Forecast");

const WEATHER_API_ENDPOINT =
  "https://api.openweathermap.org/data/2.5/weather?appid=60c936b804cef0fcb3510c8cf6788df8&units=metric";
const FORECAST_API_ENDPOINT =
  "https://api.openweathermap.org/data/2.5/forecast?appid=60c936b804cef0fcb3510c8cf6788df8&units=metric";

function findUserLocation() {
  Forecast.innerHTML = '<p style="text-align:center; padding: 20px;">Loading...</p>';
  
  if (!userLocation.value) {
    alert("Please enter a city name");
    return;
  }

  // Check if user included country code (e.g., "Paris,FR" or "Melbourne,AU")
  let searchQuery = userLocation.value.trim();
  
  fetch(`${WEATHER_API_ENDPOINT}&q=${searchQuery}`)
    .then(response => response.json())
    .then(data => {
      if (data.cod != 200) {
        // If city not found, provide helpful message
        if (data.cod == 404) {
          alert(`City "${searchQuery}" not found. Try adding country code like "Melbourne,AU" or "Paris,FR"`);
        } else {
          alert(data.message);
        }
        return;
      }

      console.log("Weather Data:", data);
      
      // City and Country
      city.innerHTML = `${data.name}, ${data.sys.country}`;

      // Temperature
      let temp = data.main.temp;
      let feelsLikeTemp = data.main.feels_like;
      
      if (converter.value === "°F") {
        temp = (temp * 9/5) + 32;
        feelsLikeTemp = (feelsLikeTemp * 9/5) + 32;
        temperature.innerHTML = Math.round(temp) + "°F";
        feelsLike.innerHTML = "Feels like " + Math.round(feelsLikeTemp) + "°F";
      } else {
        temperature.innerHTML = Math.round(temp) + "°C";
        feelsLike.innerHTML = "Feels like " + Math.round(feelsLikeTemp) + "°C";
      }

      // Description
      description.innerHTML = `<i class="fa-brands fa-cloudversify"></i> &nbsp;` + data.weather[0].description;

      // Date and Time - Using city's local time (UTC + timezone offset)
      const utcTime = new Date();
      const utcOffset = utcTime.getTimezoneOffset() * 60000; // Convert to milliseconds
      const cityTime = new Date(utcTime.getTime() + utcOffset + (data.timezone * 1000));
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      date.innerHTML = cityTime.toLocaleDateString('en-US', options) + ' at ' + cityTime.toLocaleTimeString('en-US', timeOptions);

      // Weather Icon
      weatherIcon.style.background = `url(https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png)`;

      // Today's Highlights from current weather
      HValue.innerHTML = data.main.humidity + "%";
      WValue.innerHTML = data.wind.speed + " m/s";
      CValue.innerHTML = data.clouds.all + "%";
      PValue.innerHTML = data.main.pressure + " hPa";
      
      // Sunrise and Sunset - Convert to city's local time
      const utcNow = new Date();
      const localOffset = utcNow.getTimezoneOffset() * 60000;
      
      const sunriseLocal = new Date((data.sys.sunrise * 1000) + localOffset + (data.timezone * 1000));
      const sunsetLocal = new Date((data.sys.sunset * 1000) + localOffset + (data.timezone * 1000));
      
      SRValue.innerHTML = sunriseLocal.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      SSValue.innerHTML = sunsetLocal.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      // Fetch UV Index from One Call API (free tier allows current data)
      fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${data.coord.lat}&lon=${data.coord.lon}&exclude=minutely,hourly,daily,alerts&appid=60c936b804cef0fcb3510c8cf6788df8`)
        .then(response => response.json())
        .then(uvData => {
          if (uvData.current && uvData.current.uvi !== undefined) {
            UVValue.innerHTML = uvData.current.uvi.toFixed(1);
          } else {
            UVValue.innerHTML = "N/A";
          }
        })
        .catch(err => {
          console.error("UV Index Error:", err);
          UVValue.innerHTML = "N/A";
        });

      // Fetch 5-day forecast
      fetch(`${FORECAST_API_ENDPOINT}&q=${userLocation.value}`)
        .then(response => response.json())
        .then(forecastData => {
          console.log("Forecast Data:", forecastData);
          
          Forecast.innerHTML = '';
          
          // Group forecast by day - using city's timezone
          const dailyForecasts = {};
          const utcNow = new Date();
          const localOffset = utcNow.getTimezoneOffset() * 60000;
          
          forecastData.list.forEach(item => {
            // Convert forecast time to city's local time
            const itemDate = new Date((item.dt * 1000) + localOffset + (data.timezone * 1000));
            const dateKey = itemDate.toLocaleDateString('en-US');
            
            if (!dailyForecasts[dateKey]) {
              dailyForecasts[dateKey] = {
                date: itemDate,
                temps: [],
                weather: item.weather[0],
                icon: item.weather[0].icon
              };
            }
            dailyForecasts[dateKey].temps.push(item.main.temp);
          });
          
          // Display forecast cards - using city's timezone
          const days = Object.values(dailyForecasts).slice(0, 8);
          
          days.forEach(day => {
            const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            
            let minTemp = Math.min(...day.temps);
            let maxTemp = Math.max(...day.temps);
            
            if (converter.value === "°F") {
              minTemp = (minTemp * 9/5) + 32;
              maxTemp = (maxTemp * 9/5) + 32;
            }
            
            Forecast.innerHTML += `
              <div class="forecast-item">
                <p class="forecast-day">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.weather.description}">
                <p class="forecast-desc">${day.weather.description}</p>
                <p class="forecast-temp">${Math.round(minTemp)}°${converter.value === "°F" ? "F" : "C"} ${Math.round(maxTemp)}°${converter.value === "°F" ? "F" : "C"}</p>
              </div>
            `;
          });
        })
        .catch(err => {
          console.error("Forecast API Error:", err);
          Forecast.innerHTML = '<p style="text-align:center;color:red; padding: 20px;">Unable to load forecast data</p>';
        });
    })
    .catch(err => {
      console.error("Weather API Error:", err);
      alert("Error fetching weather data. Please try again.");
    });
}

// Temperature converter change event
converter.addEventListener("change", () => {
  if (userLocation.value) {
    findUserLocation();
  }
});

// Allow Enter key to search
userLocation.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    findUserLocation();
  }
});

// Load default city on page load
window.addEventListener('DOMContentLoaded', () => {
  if (userLocation.value) {
    findUserLocation();
  }
});