(() => {
const WISHLIST_STORAGE_KEY = "second-wave-wishlist";
const heartIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 11-8.8 11s-8.8-5.9-8.8-11A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z"/></svg>';

function getWishlist() {
  const storedItems = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (!storedItems) return [];

  try {
    const items = JSON.parse(storedItems);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    return [];
  }
}

function saveWishlist(items) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

function productId(card) {
  return card.querySelector("h2, h3").textContent.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getProductDetails(card) {
  return {
    id: productId(card),
    name: card.querySelector("h2, h3").textContent.trim(),
    category: card.querySelector(".product-category").textContent.trim(),
    image: card.querySelector(".product-image img").getAttribute("src"),
    imageAlt: card.querySelector(".product-image img").getAttribute("alt"),
    specs: card.querySelector(".product-spec").textContent.trim(),
    stock: card.querySelector(".stock").textContent.trim(),
    stockClass: [...card.querySelector(".stock").classList].find((className) => className !== "stock") || "",
    price: card.querySelector(".price").childNodes[0].textContent.trim(),
    priceNote: card.querySelector(".price small")?.textContent.trim() || "",
  };
}

function renderWishlist() {
  const items = getWishlist();
  document.querySelectorAll(".wishlist-count").forEach((count) => {
    count.textContent = items.length;
  });
  document.querySelectorAll(".wishlist-button").forEach((button) => {
    button.setAttribute("aria-label", `Wishlist, ${items.length} ${items.length === 1 ? "item" : "items"}`);
  });

  document.querySelectorAll(".product-card[data-wishlist]").forEach((card) => {
    const button = card.querySelector(".product-wishlist");
    if (!button) return;
    const saved = items.some((item) => item.id === card.dataset.wishlist);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", `${saved ? "Remove" : "Add"} ${card.querySelector("h2, h3").textContent.trim()} ${saved ? "from" : "to"} wishlist`);
  });

  const grid = document.querySelector("#wishlist-grid");
  const emptyState = document.querySelector("#wishlist-empty");
  if (!grid || !emptyState) return;

  grid.replaceChildren(...items.map(createWishlistCard));
  emptyState.hidden = items.length > 0;
}

function createWishlistCard(item) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.wishlist = item.id;

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image";
  const image = document.createElement("img");
  image.src = item.image;
  image.alt = item.imageAlt;
  image.loading = "lazy";
  imageWrap.append(image, createHeartButton());

  const content = document.createElement("div");
  content.className = "product-content";
  const category = document.createElement("span");
  category.className = "product-category";
  category.textContent = item.category;
  const name = document.createElement("h2");
  name.textContent = item.name;
  const specs = document.createElement("p");
  specs.className = "product-spec";
  specs.textContent = item.specs;
  const stock = document.createElement("span");
  stock.className = `stock ${item.stockClass}`.trim();
  stock.textContent = item.stock;

  const bottom = document.createElement("div");
  bottom.className = "product-bottom";
  const price = document.createElement("span");
  price.className = "price";
  price.append(document.createTextNode(item.price));
  if (item.priceNote) {
    const note = document.createElement("small");
    note.textContent = item.priceNote;
    price.append(note);
  }
  const addButton = document.createElement("button");
  addButton.className = "add-button";
  addButton.type = "button";
  addButton.setAttribute("aria-label", `Add ${item.name} to basket`);
  addButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  if (item.stockClass === "out") {
    addButton.disabled = true;
    addButton.setAttribute("aria-label", `${item.name} is out of stock`);
  }
  bottom.append(price, addButton);
  content.append(category, name, specs, stock, bottom);
  card.append(imageWrap, content);
  return card;
}

function createHeartButton() {
  const button = document.createElement("button");
  button.className = "product-wishlist";
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = heartIcon;
  return button;
}

document.querySelectorAll(".product-card").forEach((card) => {
  card.dataset.wishlist = productId(card);
  const image = card.querySelector(".product-image");
  if (!image.querySelector(".product-wishlist")) image.append(createHeartButton());
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".product-wishlist");
  if (!button) return;

  const card = button.closest(".product-card");
  const items = getWishlist();
  const existingIndex = items.findIndex((item) => item.id === card.dataset.wishlist);
  if (existingIndex === -1) {
    items.push(getProductDetails(card));
  } else {
    items.splice(existingIndex, 1);
  }
  saveWishlist(items);
  renderWishlist();
});

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
if (menuToggle && navigation && document.querySelector("#wishlist-grid")) {
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!open));
    menuToggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
    navigation.classList.toggle("is-open", !open);
  });
}

renderWishlist();
})();
