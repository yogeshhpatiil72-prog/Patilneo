const MOVIES_URL = "movies.json";
let allMovies = [];
let activeCategory = "All";
let searchQuery = "";

const movieGrid = document.getElementById("movies");
const watchlistGrid = document.getElementById("watchlist");

function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem("cineflix-watchlist") || "[]");
  } catch {
    return [];
  }
}

function setSavedIds(ids) {
  localStorage.setItem("cineflix-watchlist", JSON.stringify(ids));
}

function escapeText(value) {
  return String(value ?? "");
}

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie";

  const posterWrap = document.createElement("div");
  posterWrap.className = "poster-wrap";

  const fallback = document.createElement("div");
  fallback.className = "poster-fallback";
  fallback.textContent = "CF";
  posterWrap.appendChild(fallback);

  if (movie.poster) {
    const img = document.createElement("img");
    img.src = movie.poster;
    img.alt = escapeText(movie.title) + " poster";
    img.loading = "lazy";
    img.onerror = () => {
      img.remove();
      fallback.textContent = "CF";
    };
    posterWrap.appendChild(img);
  }

  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("h3");
  title.textContent = escapeText(movie.title);

  const meta = document.createElement("div");
  meta.className = "movie-meta";
  const category = document.createElement("span");
  category.textContent = escapeText(movie.category);
  const year = document.createElement("span");
  year.textContent = escapeText(movie.year);
  meta.append(category, year);

  const actions = document.createElement("div");
  actions.className = "movie-actions";

  const watch = document.createElement("button");
  watch.textContent = "▶ Watch";
  watch.addEventListener("click", () => {
    window.location.href = `player.html?id=${encodeURIComponent(movie.id)}`;
  });

  const save = document.createElement("button");
  save.className = "save";
  const updateSaveButton = () => {
    const saved = getSavedIds().includes(String(movie.id));
    save.textContent = saved ? "♥" : "♡";
    save.classList.toggle("saved", saved);
    save.setAttribute("aria-label", saved ? "Remove from watchlist" : "Add to watchlist");
  };
  updateSaveButton();
  save.addEventListener("click", () => {
    const ids = getSavedIds();
    const id = String(movie.id);
    setSavedIds(ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
    renderWatchlist();
    updateSaveButton();
  });

  actions.append(watch, save);
  info.append(title, meta, actions);
  card.append(posterWrap, info);
  return card;
}

function renderMovies() {
  if (!movieGrid) return;
  movieGrid.replaceChildren();

  const filtered = allMovies.filter(movie => {
    const matchesCategory = activeCategory === "All" || movie.category === activeCategory;
    const text = `${movie.title} ${movie.category} ${movie.description || ""}`.toLowerCase();
    return matchesCategory && text.includes(searchQuery);
  });

  document.getElementById("title-count").textContent = `${filtered.length} titles`;
  document.getElementById("empty").classList.toggle("hidden", filtered.length !== 0);

  filtered.forEach(movie => movieGrid.appendChild(createMovieCard(movie)));
}

function renderWatchlist() {
  if (!watchlistGrid) return;
  watchlistGrid.replaceChildren();
  const ids = getSavedIds();
  const saved = allMovies.filter(movie => ids.includes(String(movie.id)));
  document.getElementById("watchlist-empty").classList.toggle("hidden", saved.length > 0);
  saved.forEach(movie => watchlistGrid.appendChild(createMovieCard(movie)));
}

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".category").forEach(button => {
    button.classList.toggle("active", button.dataset.category === category);
  });
  renderMovies();
}

async function loadMovies() {
  try {
    const response = await fetch(MOVIES_URL);
    if (!response.ok) throw new Error("Could not load movies.json");
    allMovies = await response.json();
    renderMovies();
    renderWatchlist();
  } catch (error) {
    movieGrid.innerHTML = '<p class="empty">Could not load the catalogue. Check that movies.json is uploaded and GitHub Pages is enabled.</p>';
  }
}

document.getElementById("search").addEventListener("input", event => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderMovies();
});

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => setCategory(button.dataset.category));
});

loadMovies();
