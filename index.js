const gallery = document.getElementById('gallery');
const favoritesGallery = document.getElementById('favoritesGallery');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterType = document.getElementById('filterType');
const randomBtn = document.getElementById('randomBtn');
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
    favoritesGallery.innerHTML = '<p> No favorites saved.</p>';
    return;
  }
  for (let i = 0; i < favorites.length; i++) {
    const art = favorites[i];
    const card = createCard(art, false);
    favoritesGallery.appendChild(card);
  }
}
function createCard(art, canSave) {
  const card = document.createElement('div');
  card.className = 'art-piece';
  const img = document.createElement('img');
  if (art.image_id) {
    img.src = IMAGE_BASE + '/' + art.image_id + '/full/843,/0/default.jpg';
  } else {
    img.alt = 'No image available';
  }
  const title = document.createElement('h3');
  title.textContent = art.title || 'Untitled';
  const artist = document.createElement('p');
  artist.textContent = 'Artist: ' + (art.artist_title || 'Unknown');
  const date = document.createElement('p');
  date.textContent = 'Date: ' + (art.date_display || 'Unknown');
  const type = document.createElement('p');
  type.textContent = 'Type: ' + (art.classification_title || 'Unknown');
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
// btn.onclick = function(){{
//     if (isFavorite=true){
//     btn.textContent = 'Remove from Favorites';
//     }
//     favorites();
// }
// displayFavorites.appendChild(btn)
// }

function showGallery(arts) {
  gallery.innerHTML = '';
  if (arts.length === 0) {
    gallery.innerHTML = '<p>No artworks found.</p>';
    return;
  }
  for (let i = 0; i < arts.length; i++) {
    const card = createCard(arts[i], true);
    gallery.appendChild(card);
  }
}
function fetchArtworks(query, type) {
  let url = API_BASE + '/search?q=' + encodeURIComponent(query || '') +
    '&limit=12&fields=id,title,artist_title,date_display,image_id,classification_title';
  if (type) {
    url += '&classification_title=' + encodeURIComponent(type);
  }
  fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    const arts = Array.isArray(data.data) ? data.data : [];
    showGallery(arts);
  })
  .catch(function() {
    gallery.innerHTML = '<p>Error loading artworks.</p>';
  });
}
function fetchRandomArtworks() {
  fetch(API_BASE + '?page=1&limit=50&fields=id,title,artist_title,date_display,image_id,classification_title', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    let arts = Array.isArray(data.data) ? data.data : [];
    arts = arts.sort(function() { return 0.5 - Math.random(); }).slice(0, 12);
    showGallery(arts);
  })
  .catch(function() {
    gallery.innerHTML = '<p>Error loading random artworks.</p>';
  });
}
searchBtn.addEventListener('click', function() {
  const query = searchInput.value;
  const type = filterType.value;
  fetchArtworks(query, type);
});
filterType.addEventListener('change', function() {
  const query = searchInput.value;
  const type = filterType.value;
  fetchArtworks(query, type);
});
randomBtn.addEventListener('click', function() {
  fetchRandomArtworks();
});
displayFavorites();
fetchRandomArtworks();
