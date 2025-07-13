let itemsData;


fetch('database.json')
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })

  .then(data => {
    itemsData = data;
    console.log(itemsData)
  })

  .catch(error => {
    console.error("There was a problem with the fetch operation:", error);
  });

searchBar()

async function searchBar() {

  const searchBar = document.getElementById("searchBar");

  searchBar.addEventListener("input", (event) => {

    const searchContent = document.querySelector(".items");

    searchContent.innerHTML = "";

    const query = event.target.value.toLowerCase();


    if (query !== "") {

      Object.entries(itemsData).forEach(([key, array]) => {
        // key is "common" of "uncommon"
        array.forEach(element => {
          
          if (element.passive.toLowerCase().includes(query)) {

            const formattedPassive = element.passive.replaceAll('\n', '<br>');

            searchContent.insertAdjacentHTML('beforeend',
              `<img src="pictures/${key}/${element.url}" alt="${element.title}">
              <p>${formattedPassive}</p>`
            );

          }

        });
        
      });

    }

  });

}