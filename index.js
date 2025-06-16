
const gallery = document.getElementById('gallery');
const favoritesGallery = document.getElementById('favoritesGallery');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterType = document.getElementById('filterType');
const randomBtn = document.getElementById('randomBtn');
const searchYear = document.getElementById('searchYear');
const API_BASE = 'https://api.artic.edu/api/v1/artworks';
const IMAGE_BASE = 'https://www.artic.edu/iiif/2';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  displayFavorites();
}

function displayFavorites() {
  favoritesGallery.innerHTML = '';
  if (favorites.length === 0) {
    favoritesGallery.innerHTML = '<p>No favorites saved.</p>';
    return;
  }
  favorites.forEach(art => {
    const card = createCard(art, true);
    favoritesGallery.appendChild(card);
  });
}




function createCard(art, canSave) {
  const card = document.createElement('div');
  card.className = 'art-piece';
  const img = document.createElement('img');
  if (art.image_id) {
    img.src = `${IMAGE_BASE}/${art.image_id}/full/843,/0/default.jpg`;
    img.alt = art.title || 'Artwork';
    img.onerror = () => {
      console.warn(`Image failed to load for ID ${art.id}: ${img.src}`);
      img.style.display = 'none';
    };
  } else {
    console.warn(`No image_id for ID ${art.id}: ${art.title}`);
    img.alt = 'No image available';
  }
  const title = document.createElement('h3');
  title.textContent = art.title || 'Untitled';
  const artist = document.createElement('p');
  artist.textContent = `Artist: ${art.artist_title || 'Unknown'}`;
  const date = document.createElement('p');
  date.textContent = `Date: ${art.date_display || 'Unknown'}`;
  const type = document.createElement('p');
  type.textContent = `Type: ${art.classification_title || 'Unknown'}`;
  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(artist);
  card.appendChild(date);
  card.appendChild(type);
  if (canSave) {
    const btn = document.createElement('button');
    let isFavorite = false;
    for (let i = 0; i < favorites.length; i++) {
      if (favorites[i].id === art.id) {
        isFavorite = true;
        break;
      }
    }
    btn.textContent = isFavorite ? 'Remove from Favorites' : 'Save to Favorites';
    btn.onclick = function() {
      if (isFavorite) {
        favorites = favorites.filter(function(f) { return f.id !== art.id; });
        btn.textContent = 'Save to Favorites';
        isFavorite = false;
      } else {
        favorites.push(art);
        btn.textContent = 'Remove from Favorites';
        isFavorite = true;
      }
      saveFavorites();
    };
    card.appendChild(btn);
  }
  return card;
}
function showGallery(arts) {
  gallery.innerHTML = '';
  if (arts.length === 0) {
    gallery.innerHTML = '<p>No artworks found.</p>';
    return;
  }
  console.log('Displaying artworks:', arts.map(art => ({
    id: art.id,
    title: art.title,
    artist_title: art.artist_title,
    date_display: art.date_display,
    classification_title: art.classification_title,
    image_id: art.image_id
  })));
  arts.forEach(art => {
    const card = createCard(art, true);
    gallery.appendChild(card);
  });
}



async function fetchArtworks(query, type, year) {
  query = query ? query.trim().toLowerCase() : '';
  type = type ? type.toLowerCase() : '';
  const yearInt = year ? parseInt(year) : null;
  if (yearInt && (yearInt < 1 || yearInt > 2025)) {
    gallery.innerHTML = '<p>Year must be between 1 and 2025.</p>';
    return;
  }

  let url = `${API_BASE}/search?q=${encodeURIComponent(query || '')}&limit=100&fields=id,title,artist_title,date_display,image_id,classification_title`;
  if (type) {
    url += `&query[term][classification_title]=${encodeURIComponent(type)}`;
  }

  console.log('API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }
    const data = await response.json();
    console.log('API Response:', data);
    let arts = Array.isArray(data.data) ? data.data.filter(art => art.image_id) : [];

   
    if (query) {
      arts = arts.filter(art =>
        (art.title && art.title.toLowerCase().includes(query)) ||
        (art.artist_title && art.artist_title.toLowerCase().includes(query))
      );
    }

    if (type) {
      arts = arts.filter(art =>
        art.classification_title && art.classification_title.toLowerCase().includes(type)
      );
    }

    if (yearInt) {
      arts = arts.filter(art => {
        if (!art.date_display) return false;
        const dateStr = art.date_display.toLowerCase();
        let hasYear = dateStr.includes(yearInt.toString());
      
        if (!hasYear && dateStr.includes('century')) {
          const centuryMatch = dateStr.match(/(\d{1,2})(?:th|st|nd|rd)\s*century/);
          if (centuryMatch) {
            const century = parseInt(centuryMatch[1]);
            const startYear = (century - 1) * 100;
            const endYear = startYear + 99;
            hasYear = yearInt >= startYear && yearInt <= endYear;
          }
        }
        console.log(`Year filter: ${yearInt}, date_display: ${art.date_display}, Match: ${hasYear}`);
        return hasYear;
      });
    }

    arts = arts.slice(0, 12);
    showGallery(arts);
  } catch (error) {
    console.error('Fetch Error:', error);
    gallery.innerHTML = `<p>Error loading artworks: ${error.message}.</p>`;
  }
}



async function fetchRandomArtworks(type) {
  type = type ? type.toLowerCase() : '';
  let url = `${API_BASE}?page=${Math.floor(Math.random() * 100) + 1}&limit=50&fields=id,title,artist_title,date_display,image_id,classification_title`;
  if (type) {
    url += `&query[term][classification_title]=${encodeURIComponent(type)}`;
  }

  console.log('Random API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }
    const data = await response.json();
    console.log('Random API Response:', data);
    let arts = Array.isArray(data.data) ? data.data.filter(art => art.image_id) : [];
    arts = arts.sort(() => 0.5 - Math.random()).slice(0, 12);
    showGallery(arts);
  } catch (error) {
    console.error('Random Fetch Error:', error);
    gallery.innerHTML = `<p>Error loading random artworks: ${error.message}.</p>`;
  }
}

searchBtn.addEventListener('click', () => {
  const query = searchInput.value;
  const type = filterType.value;
  const year = searchYear.value;
  fetchArtworks(query, type, year);
});

filterType.addEventListener('change', () => {
  const query = searchInput.value;
  const type = filterType.value;
  const year = searchYear.value;
  fetchArtworks(query, type, year);
});

searchYear.addEventListener('input', () => {
  const query = searchInput.value;
  const type = filterType.value;
  const year = searchYear.value;
  fetchArtworks(query, type, year);
});

randomBtn.addEventListener('click', () => {
  const type = filterType.value;
  fetchRandomArtworks(type);
});


displayFavorites();
fetchRandomArtworks();

