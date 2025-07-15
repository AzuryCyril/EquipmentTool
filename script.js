import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBTpjwH8UxcU-iKaZ5DHzu5Gavv0bVGCkI",
  authDomain: "mk-mobile-4044b.firebaseapp.com",
  projectId: "mk-mobile-4044b",
  storageBucket: "mk-mobile-4044b.appspot.com",
  messagingSenderId: "990394129737",
  appId: "1:990394129737:web:a803d084aad70d9d6a0e98"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let itemsData = [];

const availableTags = ["Counter: Power Drain","Counter: Freeze","Counter: Frostbite", "Counter: Bleed", "Counter: Fire", "Counter: Dark Magic", "Counter: Regeneration", "Counter: Stun", "Counter: Slow", "Counter: Poison", "Counter: Blind", "Counter: Snare", "Counter: DOTs", "Counter: All Debuffs", "Counter: All Negative effects", "Unblockable Attacks", "Unblockable Special Attacks", "Regeneration", "Power Generation", "Reduced power cost", "Shield", "Resurrection", "Invulnerability","Power Drain","Weaken","Dispel","Despair","Shield Break", "Freeze","Frostbite", "Bleed", "Fire", "Poison", "Snare", "Slow", "Stun", "Cripple", "Luck", "Strengthen", "Special 1 effect", "Special 2 effect", "Tag-in", "Tag-out", "Bars of Power","Team Effect"];

const rarityOrder = ["common", "uncommon", "rare", "epic"];

// Fetch items from Equipment collection
async function fetchItems() {
  try {
    itemsData = [];

    for (const rarity of rarityOrder) {
      const docRef = doc(db, "Equipment", rarity);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const items = docSnap.data();

        Object.keys(items).forEach(key => {
          if (!isNaN(key)) {
            const item = items[key];
            if (item.title && item.passive) {
              itemsData.push({
                id: `${rarity}_${key}`,
                rarity,
                index: key,
                ...item
              });
            }
          }
        });
      }
    }

    renderItems();
    setupSearchBar();
    setupTagFilter();
  } catch (error) {
    console.error("Firestore fetch error:", error);
  }
}

fetchItems();

function renderItems(query = "", activeFilters = []) {
  const container = document.querySelector(".items");
  container.innerHTML = "";

  itemsData.forEach(item => {
    const passiveText = (item.passive || "").toLowerCase();
    const itemTags = item.tags || [];

    const matchesQuery = query === "" || passiveText.includes(query);
    const matchesFilters =
      activeFilters.length === 0 || activeFilters.every(tag => itemTags.includes(tag));

    if (matchesQuery && matchesFilters) {
      const formattedPassive = (item.passive || "").replaceAll('\n', '<br>');
      const itemId = item.id;
      const imgSrc = `pictures/${item.rarity}/${item.url}`;

      const optionsHTML = availableTags.map(tag =>
        `<option value="${tag}">${tag}</option>`).join("");

      const tagsHTML = itemTags.map(tag =>
        `<span class="tag">${tag}</span>`).join("");

      container.insertAdjacentHTML('beforeend', `
        <article class="item" data-id="${itemId}">
          <img src="${imgSrc}" alt="${item.title}">
          <p>${formattedPassive}</p>

          <div class="tags-container" id="tags-${itemId}">
            <span class="tag-label">Tags:</span>
            <div class="tags">${tagsHTML}</div>
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

  setupTagControls();
}



function setupSearchBar() {
  const searchBar = document.getElementById("searchBar");
  const checkboxes = document.querySelectorAll('input[name="filter"]');

  const getActiveFilters = () => {
    return Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  };

  if (!searchBar) return;

  searchBar.addEventListener("input", event => {
    const query = event.target.value.toLowerCase();
    const activeFilters = getActiveFilters();
    renderItems(query, activeFilters);
  });
}

function setupTagControls() {
  document.querySelectorAll('.add-tag-btn').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.id;
      const dropdown = document.getElementById(`dropdown-${id}`);
      dropdown.classList.toggle('hidden');
    };
  });

  document.querySelectorAll('.submit-tag-btn').forEach(button => {
    button.onclick = async () => {
      const id = button.dataset.id;
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

          try {
            // id format: rarity_index (e.g., epic_0)
            const [rarity, index] = id.split('_');

            // Get reference to the specific item in Firestore nested under rarity doc
            // Field to update is the array 'tags' inside that item, but Firestore
            // doesn't support nested array update directly; workaround needed:

            // You need to update the whole item object or store tags at top level of doc.

            // Here let's update the tags array of the item inside the rarity doc:
            const rarityDocRef = doc(db, "Equipment", rarity);

            // Get current document data, update the nested item tags locally then update doc:
            const rarityDocSnap = await getDocs(collection(db, "Equipment"));
            // Actually, to update, best is to use updateDoc with a field path:
            // Field path: `${index}.tags`

            await updateDoc(rarityDocRef, {
              [`${index}.tags`]: arrayUnion(selectedTag)
            });

          } catch (err) {
            console.error("Failed to update Firestore:", err);
            alert("Could not save tag to Firestore.");
          }
        }

        select.selectedIndex = 0;
        dropdown.classList.add('hidden');
      }
    };
  });
}


function setupTagFilter() {
  const checkboxes = document.querySelectorAll('input[name="filter"]');
  const searchBar = document.getElementById("searchBar");

  const getActiveFilters = () => {
    return Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  };

  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const query = searchBar.value.toLowerCase();
      const activeFilters = getActiveFilters();
      renderItems(query, activeFilters);
    });
  });
}