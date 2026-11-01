//Del 1: Trainers
//Gør det muligt at søge på trænere og pokemons
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");

if (searchInput && searchResults) {
    searchInput.addEventListener("input", () => {
        const searchValue = searchInput.value.trim();

        searchResults.replaceChildren();

        if (searchValue === "") {
            return;
        }
        //Fetcher trainers + det brugeren har skrevet i søgefeltet
        fetch(`http://localhost:3000/trainer/${encodeURIComponent(searchValue)}`)
            .then(response => response.json())
            .then(data => renderTrainers(data, searchResults));
    });
}


function renderTrainers(trainers, container) {
    trainers.forEach(trainer => {
        const pTag = document.createElement("p");
        pTag.textContent = trainer.trainer_name;

        // Gør trænerne klikbare
        pTag.addEventListener("click", () => {
            window.location.href = `Trainer.html?id=${trainer.trainer_id}`;
        });
// Sæt navnet ind på siden
        container.appendChild(pTag);
    });
}
// Viser listen over alle trainers på Trainer-siden
function renderTrainerList(trainers) {
    // Find elementet, hvor listen skal stå
    const trainerList = document.querySelector("#trainerList");

    // Tøm listen først, så navnene ikke kommer to gange
    trainerList.replaceChildren();
    // Brug den fælles funktion til at lave navnene
    renderTrainers(trainers, trainerList);
}

// Viser oplysninger om ÉN trainer og hans/hendes pokémon i #trainerList
function showTrainerDetails(trainer, pokemonList) {
    const trainerList = document.querySelector("#trainerList");

    // Tøm området, så der ikke står gammelt indhold
    trainerList.replaceChildren();

    // Hvis traineren ikke har nogen pokémon, vis en besked og stop her
    if (pokemonList.length === 0) {
        trainerList.textContent = "No Pokemons found:";
        return;
    }

    // Vis trænerens navn (finder den første <h2> på siden og flytter den ind)
    const heading = document.querySelector("h2");
    heading.textContent = "Trainer name:" + " " + pokemonList[0].trainer_name;
    trainerList.appendChild(heading);

    //Trænerens id
    const pID = document.createElement("p");
    pID.textContent = "Trainer id:" + " " + trainer.trainer_id;
    trainerList.appendChild(pID);

    //Trænerens by
    const pHome = document.createElement("p");
    pHome.textContent = "Hometown:" + " " +  trainer.hometown;
    trainerList.appendChild(pHome);

    //Trænerens alder
    const pAge = document.createElement("p");
    pAge.textContent = "Age:" + " " + trainer.age;
    trainerList.appendChild(pAge);

    // Vis trænerens Pokémon: en overskrift og så ét <p> pr. pokémon
    const pokemonHeading = document.createElement("h2");
    pokemonHeading.textContent = "Pokémon";
    trainerList.appendChild(pokemonHeading);
    pokemonList.forEach(pokemon => {
        const pTag = document.createElement("p");
        pTag.textContent = pokemon.name;
        trainerList.appendChild(pTag);
    });
}

// Bestemmer, hvad der skal vises, ud fra adressen (med eller uden ?id=...)
function getTrainers() {
    // Læs id'et fra adressen, fx Trainer.html?id=3 giver "3"
    const params = new URLSearchParams(window.location.search);
    const trainerId = params.get("id");

    if (trainerId) {
        // Der er et id: hent alle trainers OG denne trainers pokémon samtidig
        Promise.all([
            fetch("http://localhost:3000/trainers")
                .then(response => response.json()),

            fetch(`http://localhost:3000/trainerpokemon/${trainerId}`)
                .then(response => response.json())
        ])
            .then(([trainers, pokemonList]) => {
                const trainer = trainers.find(
                    trainer => String(trainer.trainer_id) === trainerId
                );

                // Viser kun noget, hvis traineren blev fundet
                if (trainer) {
                    showTrainerDetails(trainer, pokemonList);
                }
            })
            .catch(error => console.error("Error:", error));

    } else {
        // Intet id: hent alle trainers og vis dem som en liste
        fetch("http://localhost:3000/trainers")
            .then(response => response.json())
            .then(data => {
                renderTrainerList(data);
            })
            .catch(error => console.error("Error:", error));
    }
}
// Kør getTrainers, men kun på sider, der har #trainerList (altså Trainer-siden)
if (document.querySelector("#trainerList")) {
    getTrainers();
}

//Oprette en ny trainer
const createTrainerForm = document.querySelector("#createTrainerForm");
// Kun hvis siden har formularen
if (createTrainerForm) {
    createTrainerForm.addEventListener("submit", (event) => {
        // Stop siden i at genindlæse, når man trykker på knappen
        event.preventDefault();

        // Læs værdierne fra felterne (alder laves om til et tal)
        const trainerName = document.querySelector("#trainerNameInput").value;
        const hometown = document.querySelector("#hometownInput").value;
        const age = Number(document.querySelector("#ageInput").value);

        // Send dataen til serveren som JSON
        fetch('http://localhost:3000/new/trainer', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                trainer_name: trainerName,
                hometown: hometown,
                age: age
            })
        })
            .then(response => response.text())
            .then(data => {
                console.log(data);
                // Vis serverens svar under formularen
                document.querySelector("#trainerMessage").textContent = data;
                // Lykkedes det: tøm formularen og hent listen igen
                if (data === "Trainer created successfully!") {
                    createTrainerForm.reset();
                    getTrainers();
                }
            })
            .catch(error => {
                console.error(error);

                // Serveren kunne ikke nås
                document.querySelector("#trainerMessage").textContent =
                    "Failed to create trainer. Please try again.";
            });
    });
}
//Dropdown med trainers (listen med trainers når man skal vælge den trainer man vil tilføje en pokemon til)
const trainerSelect = document.querySelector("#trainerSelect");
if (trainerSelect) {
    // Hent alle trainers og lav en <option> for hver
    fetch("http://localhost:3000/trainers")
        .then(response => response.json())
        .then(trainers => {
            trainers.forEach(trainer => {
                const option = document.createElement("option");
                // det der sendes til serveren
                option.value = trainer.trainer_id;
                // det brugeren ser
                option.textContent = trainer.trainer_name;

                trainerSelect.appendChild(option);
            });
        });
}
//Tilføj en pokemon til en trainer
const addPokemonForm = document.querySelector("#addPokemonForm");

if (addPokemonForm) {
    addPokemonForm.addEventListener("submit", (event) => {
        // Stop siden i at genindlæse
        event.preventDefault();

        // Læs valgt trainer og valgt pokémon fra de to dropdowns
        const trainerId = trainerSelect.value;
        const pokedexNumber = pokemonSelect.value;

        // Send valget til serveren som JSON
        fetch("http://localhost:3000/trainer/pokemon/new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                trainer_id: trainerId,
                pokedex_number: pokedexNumber
            })
        })
            .then(response => {
                // Giver serveren en fejlstatus, spring til .catch
                if (!response.ok) {
                    throw new Error("Could not add Pokémon");
                }
                return response.text();
            })
            .then(data => {
                // Vis serverens svar og nulstil dropdowns
                document.querySelector("#pokemonMessage").textContent = data;

                addPokemonForm.reset();
            })
            .catch(error => {
                console.error(error);

                document.querySelector("#pokemonMessage").textContent =
                    "Failed to add Pokémon. Please try again.";
            });
    });
}
//Dropdown med pokemons (de pokemons man kan vælge at tilføje til en trainer)
const pokemonSelect = document.querySelector("#pokemonSelect");

if (pokemonSelect) {
    // Hent alle pokémon og lav en <option> for hver
    fetch("http://localhost:3000/pokemon")
        .then(response => response.json())
        .then(pokemons => {
            pokemons.forEach(pokemon => {
                const option = document.createElement("option");
                // det der sendes til serveren
                option.value = pokemon.pokedex_number;
                // det brugeren ser
                option.textContent = pokemon.name;
                pokemonSelect.appendChild(option);
            });
        });
}

//Del 2: Pokemons
const pokemonList = document.querySelector("#pokemonList");
const showAllBtn = document.querySelector("#showAllBtn");

let searchController;

let evolutions = [];

// Henter alle evolutioner fra serveren, når siden åbnes, og gemmer dem i "evolutions"
fetch("http://localhost:3000/evolutions")
    .then(response => response.json())
    .then(data => {
        evolutions = data;
    })
    .catch(error => console.error("Fejl ved evolutioner:", error));

// Søgning: kører hver gang man skriver i søgefeltet. Tal søger på attack, tekst søger på navn (og ellers på type).
// Resultaterne vises under søgefeltet med billede, og et klik viser pokémonen eller sender én til Pokemon.html
searchInput.addEventListener("input", () => {

    const searchValue = searchInput.value.trim();

    if (searchController) {
        searchController.abort();
    }
    searchResults.replaceChildren();

    if (searchValue === "") {
        return;
    }
    searchController = new AbortController();

    let url;

    if (!isNaN(searchValue)) {
        url = `http://localhost:3000/pokemon?minAttack=${searchValue}`;

    } else {
        url = `http://localhost:3000/pokemon?name=${encodeURIComponent(searchValue)}`;
    }

    fetch(url, { signal: searchController.signal })
        .then(response => response.json())
        .then(data => {

            if (isNaN(searchValue) && data.length === 0) {

                return fetch(
                    `http://localhost:3000/pokemon?type=${encodeURIComponent(searchValue)}`,
                    { signal: searchController.signal }
                ).then(response => response.json());
            }
            return data;
        })
        .then(data => {

            searchResults.replaceChildren();

            data.forEach(pokemon => {
                const pokemonEvolutions = evolutions.filter(e =>
                    e.from_number === pokemon.pokedex_number
                );

                const evolutionNames = pokemonEvolutions.map(e => e.to_pokemon);

                const evolutionText = evolutionNames.length > 0
                    ? evolutionNames.join(", ")
                    : "Ingen videre evolution";

                const result = document.createElement("p");

                result.textContent =
                    `${pokemon.name} | Type: ${pokemon.primary_type} | Attack: ${pokemon.attack} | HP: ${pokemon.hp} | Evolution: ${evolutionText}`;
                result.style.cursor = "pointer";
                const img = document.createElement("img");

                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedex_number}.png`;

                img.alt = pokemon.name;
                img.width = 80;

                result.appendChild(img);

                result.addEventListener("click", () => {
                    if (pokemonList) {
                        showPokemonDetails(pokemon);
                    } else {
                        window.location.href = `Pokemon.html?id=${pokemon.pokedex_number}`;
                    }
                });
                searchResults.appendChild(result);
            });
        })
        .catch(error => {
            if (error.name !== "AbortError") {
                console.error("Fejl:", error);
            }
        });
});

// Kører kun på Pokemon-siden: henter alle pokémon. Står der ?id= i adressen, vises den ene pokémon, ellers hele listen
let allPokemon = [];

if (pokemonList) {

    fetch("http://localhost:3000/pokemon")
        .then(response => response.json())
        .then(data => {
            allPokemon = data;

            const params = new URLSearchParams(window.location.search);
            const pokemonId = Number(params.get("id"));

            const selectedPokemon = allPokemon.find(pokemon =>
                pokemon.pokedex_number === pokemonId
            );

            if (selectedPokemon) {
                showPokemonDetails(selectedPokemon);
            } else {
                showPokemonList(allPokemon);
            }
        })
        .catch(error => console.error("Fejl:", error));
}

// Viser alle pokémon som en liste med billede, alle stats og evolution. Klik viser detaljer
function showPokemonList(pokemons) {

    pokemonList.replaceChildren();

    pokemons.forEach(pokemon => {
        const pokemonEvolutions = evolutions.filter(e =>
            e.from_number === pokemon.pokedex_number
        );

        const evolutionNames = pokemonEvolutions.map(e => e.to_pokemon);

        const evolutionText = evolutionNames.length > 0
            ? evolutionNames.join(", ")
            : "Ingen videre evolution";

        const result = document.createElement("p");

// Navnet får sit eget element (spen), så det kan styles for sig selv
        const nameH3 = document.createElement("h3");
        nameH3.textContent = pokemon.name;
        nameH3.classList.add("pokemonName");

        //resten af pokemonens informartioner i et tag
        result.append(
            nameH3,
            ` | Type: ${pokemon.primary_type} | Secondary Type: ${pokemon.secondary_type || "None"} | HP: ${pokemon.hp} | Attack: ${pokemon.attack} | Defence: ${pokemon.defence} | Special Attack: ${pokemon.special_attack} | Special Defence: ${pokemon.special_defence} | Speed: ${pokemon.speed}| Evolution: ${evolutionText}`
        );
        result.style.cursor = "pointer";

        const img = document.createElement("img");

        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedex_number}.png`;

        img.alt = pokemon.name;
        img.width = 80;


        result.prepend(img); //sætter billedet ind forrest i p-tagget
        result.addEventListener("click", () => {
            showPokemonDetails(pokemon);
        });
        pokemonList.appendChild(result);
    });
}

// Viser én pokémon med navn, stort billede og alle stats (og tømmer listen og søgeresultaterne først)
function showPokemonDetails(pokemon) {

    pokemonList.replaceChildren();
    searchResults.replaceChildren();

    const pokemonEvolutions = evolutions.filter(e =>
        e.from_number === pokemon.pokedex_number
    );

    const evolutionNames = pokemonEvolutions.map(e => e.to_pokemon);

    const evolutionText = evolutionNames.length > 0
        ? evolutionNames.join(", ")
        : "Ingen videre evolution";

    const result = document.createElement("div");

    const heading = document.createElement("h2");
    heading.textContent = pokemon.name;
    result.appendChild(heading);

    const img = document.createElement("img");

    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedex_number}.png`;

    img.alt = pokemon.name;
    img.width = 200;

    result.appendChild(img);

    const details = [
        `Pokédex Number: ${pokemon.pokedex_number}`,
        `Primary Type: ${pokemon.primary_type}`,
        `Secondary Type: ${pokemon.secondary_type || "None"}`,
        `HP: ${pokemon.hp}`,
        `Attack: ${pokemon.attack}`,
        `Defence: ${pokemon.defence}`,
        `Special Attack: ${pokemon.special_attack}`,
        `Special Defence: ${pokemon.special_defence}`,
        `Speed: ${pokemon.speed}`,
        `Evolution: ${evolutionText}`
    ];

    details.forEach(detail => {
        const paragraph = document.createElement("p");
        paragraph.textContent = detail;
        result.appendChild(paragraph);
    });

    pokemonList.appendChild(result);
}

// Knappen "Vis alle Pokémon": tømmer søgefeltet og viser hele listen igen
if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {

        searchInput.value = "";

        searchResults.replaceChildren();

        showPokemonList(allPokemon);

    });
}


//Del 3: Dashboard
// Plugin til Chart.js: farver søjlerne som en pokéball (rød, sort, hvid)
const pokemonColors = {
    id: "pokemonColors",

    beforeDatasetsDraw(chart) {
        chart.data.datasets.forEach((dataset, index) => {
            chart.getDatasetMeta(index).data.forEach(bar => {
                const top = bar.horizontal
                    ? bar.y - bar.height / 2
                    : Math.min(bar.y, bar.base);

                const bottom = bar.horizontal
                    ? bar.y + bar.height / 2
                    : Math.max(bar.y, bar.base);

                if (
                    !Number.isFinite(top) ||
                    !Number.isFinite(bottom) ||
                    bottom <= top
                ) {
                    return;
                }

                const gradient = chart.ctx.createLinearGradient(
                    0, top, 0, bottom
                );

                gradient.addColorStop(0, "#e9360d");
                gradient.addColorStop(0.45, "#e9360d");
                gradient.addColorStop(0.45, "#000000");
                gradient.addColorStop(0.55, "#000000");
                gradient.addColorStop(0.55, "#ffffff");
                gradient.addColorStop(1, "#ffffff");

                bar.options = {
                    ...bar.options,
                    backgroundColor: gradient
                };
            });
        });
    }
};

// Henter statistik fra serveren. Giver en fejl, hvis serveren fejler, eller hvis svaret ikke er en liste
async function getStats(endpoint) {
    const response = await fetch("http://localhost:3000" + endpoint);

    if (!response.ok) {
        throw new Error("Kunne ikke hente statistik");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("Serveren returnerede ikke en liste");
    }

    return data;
}

// Tegner ét søjlediagram. Bruges til alle tre diagrammer (type, attack og speed)
async function showChart(
    endpoint,
    canvasId,
    statusId,
    labelKey,
    valueKey,
    label,
    horizontal = false,
    integers = false
) {
    const status = document.getElementById(statusId);
    const canvas = document.getElementById(canvasId);

    if (!status || !canvas) {
        return;
    }

    try {
        const data = await getStats(endpoint);

        if (typeof Chart === "undefined") {
            throw new Error("Chart.js kunne ikke indlæses");
        }

        const existingChart = Chart.getChart(canvas);

        if (existingChart) {
            existingChart.destroy();
        }

        if (data.length === 0) {
            status.textContent = "Ingen data at vise.";
            return;
        }

        new Chart(canvas, {
            type: "bar",
            plugins: [pokemonColors],

            data: {
                labels: data.map(item => item[labelKey] ?? "Ukendt"),

                datasets: [{
                    label: label,
                    data: data.map(item =>
                        item[valueKey] === null
                            ? null
                            : Number(item[valueKey])
                    ),
                    backgroundColor: "#e9360d",
                    borderColor: "#000000",
                    hoverBorderColor: "#000000",
                    borderWidth: 2,
                    borderSkipped: false,
                    borderRadius: 4
                }]
            },

            options: {
                indexAxis: horizontal ? "y" : "x",
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    [horizontal ? "x" : "y"]: {
                        beginAtZero: true,
                        ticks: integers ? { precision: 0 } : {}
                    },

                    [horizontal ? "y" : "x"]: {
                        ticks: {
                            autoSkip: false
                        }
                    }
                }
            }
        });

        status.textContent = "";
        status.classList.remove("error");
    } catch (error) {
        status.textContent = error.message;
        status.classList.add("error");
        console.error(error);
    }
}

// Fylder tabellen med de trainers, der har flest pokémon
async function showTopTrainers() {
    const status = document.getElementById("trainer-status");
    const tbody = document.getElementById("trainer-stats");

    if (!status || !tbody) {
        return;
    }

    try {
        const data = await getStats("/stats/top-trainers");

        tbody.replaceChildren();

        data.forEach(trainer => {
            const row = document.createElement("tr");
            const name = document.createElement("td");
            const count = document.createElement("td");

            name.textContent = trainer.trainer_name;
            count.textContent = trainer.antal_pokemon;

            row.append(name, count);
            tbody.appendChild(row);
        });

        status.textContent = data.length
            ? ""
            : "Ingen trainers at vise.";

        status.classList.remove("error");
    } catch (error) {
        status.textContent = error.message;
        status.classList.add("error");
        console.error(error);
    }
}

// Når siden er klar, tegnes de tre diagrammer (type, attack, speed) og tabellen med trainers
document.addEventListener("DOMContentLoaded", () => {
    showChart(
        "/stats/type-distribution",
        "type-chart",
        "type-status",
        "type",
        "antal",
        "Antal Pokémon",
        false,
        true
    );

    showChart(
        "/stats/average-attack",
        "attack-chart",
        "attack-status",
        "type",
        "gennemsnitlig_attack",
        "Gennemsnitlig attack"
    );

    showChart(
        "/stats/fastest-pokemon",
        "speed-chart",
        "speed-status",
        "name",
        "speed",
        "Speed",
        true,
        true
    );

    showTopTrainers();

});
