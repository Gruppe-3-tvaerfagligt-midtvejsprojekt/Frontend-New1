
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");

searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.trim();

    if (searchValue === "") {
        searchResults.replaceChildren();
        return;
    }

    fetch(`http://localhost:3000/pokemon?name=${encodeURIComponent(searchValue)}`)
        .then(response => response.json())
        .then(data => {
            searchResults.replaceChildren();

            data.forEach(pokemon => {
                const result = document.createElement("p");
                result.textContent = pokemon.name;
                searchResults.appendChild(result);
            });
        })
        .catch(error => {
            console.error("Fejl ved hentning af Pokémon:", error);
        });
});



fetch('http://localhost:3000/trainers')
    .then(response => response.json())
    .then(data => {
        console.log(":", data);
    });

fetch('http://localhost:3000/trainerpokemon/1')
    .then(response => response.json())
    .then(data => {
        console.log("", data);
    });