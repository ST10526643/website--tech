(() => {
  const STORAGE_KEY = "second-wave-basket";
  const CURRENCY = "$";
  let toastTimer;

  function readBasket() {
    const storedItems = localStorage.getItem(STORAGE_KEY);
    if (!storedItems) return [];

    try {
      const items = JSON.parse(storedItems);
      if (!Array.isArray(items)) throw new TypeError("Basket data must be an array");
      return items.filter((item) =>
        item && typeof item.id === "string"
        && typeof item.name === "string"
        && Number.isFinite(item.price)
        && Number.isInteger(item.quantity)
        && item.quantity > 0
      );
    } catch (error) {
      console.error("Could not read saved basket data.", error);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  function writeBasket(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error("Could not save basket changes.", error);
      showToast("Your basket could not be saved. Check your browser storage settings.");
      return false;
    }
  }

  function getProductId(card) {
    return card.querySelector("h2, h3").textContent.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function getProduct(card) {
    const priceText = card.querySelector(".price").childNodes[0].textContent.trim();
    const price = Number.parseFloat(priceText.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(price)) throw new Error(`Product has an invalid price: ${priceText}`);

    return {
      id: getProductId(card),
      name: card.querySelector("h2, h3").textContent.trim(),
      category: card.querySelector(".product-category").textContent.trim(),
      image: card.querySelector(".product-image img").getAttribute("src"),
      imageAlt: card.querySelector(".product-image img").getAttribute("alt"),
      specs: card.querySelector(".product-spec").textContent.trim(),
      price,
      priceLabel: priceText,
      quantity: 1,
    };
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function updateCounts(items = readBasket()) {
    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll(".basket-count").forEach((count) => {
      count.textContent = totalQuantity;
      const label = `Shopping basket, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`;
      count.setAttribute("aria-label", label);
      count.closest("a.basket-button")?.setAttribute("aria-label", label);
    });
  }

  function normalizeBasketButtons() {
    document.querySelectorAll(".header-tools > a.basket-count").forEach((button) => {
      const count = document.createElement("span");
      count.className = "basket-count";
      count.setAttribute("aria-live", "polite");
      count.textContent = button.textContent.trim() || "0";

      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "1.7");
      icon.setAttribute("stroke-linecap", "round");
      icon.setAttribute("stroke-linejoin", "round");
      icon.setAttribute("aria-hidden", "true");

      const bag = document.createElementNS("http://www.w3.org/2000/svg", "path");
      bag.setAttribute("d", "M5 8h14l1 12H4L5 8Z");
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "path");
      handle.setAttribute("d", "M9 9V6a3 3 0 0 1 6 0v3");
      icon.append(bag, handle);

      button.classList.replace("basket-count", "basket-button");
      button.replaceChildren(icon, count);
    });
  }

  function updateCheckout(items) {
    const checkout = document.querySelector("#basket-checkout");
    if (!checkout) return;
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const orderLines = items.map((item) => `${item.quantity} x ${item.name} (${item.priceLabel} each)`);
    const body = [
      "Hello Second Wave,",
      "",
      "I would like to enquire about ordering:",
      ...orderLines,
      "",
      `Estimated subtotal: ${CURRENCY}${subtotal.toFixed(2)}`,
      "",
      "Please confirm availability and delivery details.",
    ].join("\n");
    checkout.href = `mailto:hello@secondwave.tech?subject=${encodeURIComponent("Order enquiry — Second Wave")}&body=${encodeURIComponent(body)}`;
    checkout.setAttribute("aria-disabled", String(items.length === 0));
    checkout.classList.toggle("is-disabled", items.length === 0);
  }

  function createBasketLine(item) {
    const row = document.createElement("article");
    row.className = "basket-line";
    row.dataset.basketId = item.id;

    const image = document.createElement("img");
    image.className = "basket-line-image";
    image.src = item.image;
    image.alt = item.imageAlt || item.name;
    image.loading = "lazy";

    const details = document.createElement("div");
    details.className = "basket-line-details";
    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = item.category || "Technology";
    const name = document.createElement("h2");
    name.textContent = item.name;
    const specs = document.createElement("p");
    specs.className = "product-spec";
    specs.textContent = item.specs || "";
    details.append(category, name, specs);

    const controls = document.createElement("div");
    controls.className = "basket-line-controls";
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = `${item.priceLabel || `${CURRENCY}${item.price}`} each`;

    const quantity = document.createElement("div");
    quantity.className = "basket-quantity";
    quantity.setAttribute("aria-label", `Quantity for ${item.name}`);
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.dataset.basketAction = "decrease";
    decrease.setAttribute("aria-label", `Decrease ${item.name} quantity`);
    decrease.textContent = "−";
    const count = document.createElement("span");
    count.textContent = item.quantity;
    const increase = document.createElement("button");
    increase.type = "button";
    increase.dataset.basketAction = "increase";
    increase.setAttribute("aria-label", `Increase ${item.name} quantity`);
    increase.textContent = "+";
    quantity.append(decrease, count, increase);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "basket-remove";
    remove.dataset.basketAction = "remove";
    remove.setAttribute("aria-label", `Remove ${item.name} from basket`);
    remove.textContent = "Remove";
    controls.append(price, quantity, remove);
    row.append(image, details, controls);
    return row;
  }

  function renderBasket() {
    const items = readBasket();
    updateCounts(items);

    const list = document.querySelector("#basket-items");
    const empty = document.querySelector("#basket-empty");
    const summary = document.querySelector("#basket-summary");
    if (!list || !empty || !summary) return;

    list.replaceChildren(...items.map(createBasketLine));
    empty.hidden = items.length > 0;
    summary.hidden = items.length === 0;
    const quantity = items.reduce((total, item) => total + item.quantity, 0);
    document.querySelector("#basket-item-count").textContent =
      `${quantity} ${quantity === 1 ? "item" : "items"}`;
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    document.querySelector("#basket-subtotal").textContent = `${CURRENCY}${subtotal.toFixed(2)}`;
    updateCheckout(items);
  }

  function saveAndRender(items) {
    if (writeBasket(items)) {
      renderBasket();
      window.dispatchEvent(new Event("basketchange"));
    }
  }

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest(".add-button:not(:disabled)");
    if (addButton) {
      const card = addButton.closest(".product-card");
      if (!card || !card.querySelector(".product-image img")) return;

      const product = getProduct(card);
      const items = readBasket();
      const existing = items.find((item) => item.id === product.id);
      if (existing) existing.quantity += 1;
      else items.push(product);
      saveAndRender(items);
      showToast(`${product.name} added to your basket`);
      return;
    }

    const actionButton = event.target.closest("[data-basket-action]");
    if (!actionButton) return;
    const row = actionButton.closest("[data-basket-id]");
    if (!row) return;

    const items = readBasket();
    const item = items.find((entry) => entry.id === row.dataset.basketId);
    if (!item) return;

    if (actionButton.dataset.basketAction === "remove") {
      saveAndRender(items.filter((entry) => entry.id !== item.id));
    } else if (actionButton.dataset.basketAction === "increase") {
      item.quantity += 1;
      saveAndRender(items);
    } else if (actionButton.dataset.basketAction === "decrease") {
      item.quantity -= 1;
      saveAndRender(items.filter((entry) => entry.quantity > 0));
    }
  });

  document.querySelector("#basket-clear")?.addEventListener("click", () => saveAndRender([]));
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) renderBasket();
  });

  normalizeBasketButtons();
  renderBasket();
})();
