let itemsData;

// Define available tags
const availableTags = ["Damage", "Utility", "Healing", "Crowd Control", "Defense", "Mobility"];

// Fetch data and initialize
fetch('database.json')
  .then(response => {
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  })
  .then(data => {
    itemsData = data;
    renderItems();
    setupSearchBar();
  })
  .catch(error => {
    console.error("Fetch error:", error);
  });

// Render items, optionally filtered by query
function renderItems(query = "") {
  const container = document.querySelector(".items");
  container.innerHTML = "";

  Object.entries(itemsData).forEach(([key, array]) => {
    array.forEach((item, index) => {
      const passiveText = item.passive.toLowerCase();
      if (query === "" || passiveText.includes(query)) {
        const formattedPassive = item.passive.replaceAll('\n', '<br>');
        const itemId = `${key}-${index}`;

        // Build tag dropdown options
        const optionsHTML = availableTags.map(tag =>
          `<option value="${tag}">${tag}</option>`).join("");

        container.insertAdjacentHTML('beforeend', `
          <article class="item" data-id="${itemId}">
            <img src="pictures/${key}/${item.url}" alt="${item.title}">
            <p>${formattedPassive}</p>

            <div class="tags-container" id="tags-${itemId}">
              <span class="tag-label">Tags:</span>
              <div class="tags"></div>
              <button class="add-tag-btn" data-id="${itemId}">+</button>
              <div class="tag-dropdown-container hidden" id="dropdown-${itemId}">
                <select class="tag-select">
                  <option value="" disabled selected>Select a tag</option>
                  ${optionsHTML}
                </select>
                <button class="submit-tag-btn" data-id="${itemId}">Add</button>
              </div>
            </div>
          </article>
        `);
      }
    });
  });

  setupTagControls(); // Attach tag dropdown logic
}

// Setup search input
function setupSearchBar() {
  const searchBar = document.getElementById("searchBar");
  searchBar.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    renderItems(query);
  });
}

function setupTagControls() {
  document.querySelectorAll('.add-tag-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const dropdown = document.getElementById(`dropdown-${id}`);
      dropdown.classList.toggle('hidden');
    });
  });

  document.querySelectorAll('.submit-tag-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      const [category, index] = id.split("-");
      const dropdown = document.getElementById(`dropdown-${id}`);
      const select = dropdown.querySelector('.tag-select');
      const selectedTag = select.value;

      if (selectedTag) {
        const tagBox = document.querySelector(`#tags-${id} .tags`);
        const existingTags = Array.from(tagBox.children).map(tag => tag.textContent);

        if (!existingTags.includes(selectedTag)) {
          const tagElement = document.createElement('span');
          tagElement.classList.add('tag');
          tagElement.textContent = selectedTag;
          tagBox.appendChild(tagElement);

          // ✅ Send to server
          try {
            const res = await fetch("/add-tag", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category,
                index: Number(index),
                tag: selectedTag
              })
            });

            if (!res.ok) throw new Error("Failed to save tag.");
          } catch (err) {
            console.error(err);
            alert("Failed to save tag to server.");
          }
        }

        select.selectedIndex = 0;
        dropdown.classList.add('hidden');
      }
    });
  });
}
