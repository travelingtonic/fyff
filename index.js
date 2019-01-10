/* ********************
Data Stores
******************** */
const petFinderApiKey = '78b9651adad85f0ed7fc2ebfe786900d';

const store = {
    isSearchStart: true,
    hasError: false,
    hasResults: false,
    breedQuery: null,
    zipQuery: null,
    error: []
};


/* ********************
Application Tasks
******************** */
function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      console.log(queryItems);
    return queryItems.join('&');
  }

function getAdoptions() {
    console.log(`getAdoptions ran`);
    const query = BREEDS[store.breedQuery].adoptionBreed;
        const params = {
            key: petFinderApiKey,
            format: "json",
            output: "basic",
            count: "10",
            breed: query,
            location: store.zipQuery
        };
        const queryString = formatQueryParams(params);
        const url = 'https://api.petfinder.com/pet.find?' + queryString + '&callback=?';
        console.log(url);
        $.getJSON(url).then(function checkAdoptionResults(responseJson) {
            console.log(`checking for adoption results`);
            let err = '';
            if(responseJson.petfinder.hasOwnProperty('pets')) {
                if(responseJson.petfinder.pets.hasOwnProperty('pet') && responseJson.petfinder.pets.pet !== undefined && responseJson.petfinder.pets.pet !== null) {
                    console.log(`We have adoption records`);
                    saveAdoptions(responseJson);

                }
                else {
                    console.log(`We do not have adoption results`);
                    err = 'Sorry, we had trouble retrieving adoptions. Please try again.';
                    saveErrorEvent(err);
                }
            }
            else {
                console.log(`We do not have adoption results`);
                if(responseJson.petfinder.hasOwnProperty('header')) {
                    err = `${responseJson.petfinder.header.status.message.$t}. Please try again.`;
                    saveErrorEvent(err);
                }
                else {
                    err = 'Sorry, we had trouble retrieving adoptions. Please try again.';
                    saveErrorEvent(err);
                }
                
            }
        })
}

function saveAdoptions(responseJson) {
    
    store.hasResults = true;

    render();
}

function saveErrorEvent(err) {
    store.hasError = true;
    store.error.push(err);

    render();
}

function saveQuery(breed, zip) {
    store.breedQuery = breed;
    store.zipQuery = zip;

    console.log(`saveQuery ran,
    breed: ${store.breedQuery}
    zip: ${store.zipQuery}`);
}

function saveSearchEvent() {
    store.isSearchStart = false;
    store.hasError = false;
    store.hasResults = false;
}

function validateBreed() {
    return (store.breedQuery >= 0 && store.breedQuery < BREEDS.length ? true : false);
}

function validateZipCode() {
    const zipExpression = /^[0-9]{5}(?:-[0-9]{4})?$/;

    return (zipExpression.test(store.zipQuery) ? true : false);
}


/* ********************
HTML Generation
******************** */
function generateBreedDropDown() {
    let dropDownHtml = `<select id="query">`;

    for(let x = 0; x < BREEDS.length; x ++) {
        dropDownHtml += `<option value="${x}">${BREEDS[x].adoptionBreed}</option>`;
    }
    dropDownHtml += `</select>`;

    return dropDownHtml;
}

function generateErrorHtml() {
    let err = store.error.join(`</p><p class="error">`);
    let html = `<section role="region" class="js-errors row">
    <p class="error">${err}</p>
    </section>`;

    return html;
}


/* ********************
HTML Render
******************** */
function render() { 
    console.log(`Application state:
    isSearchStart = ${store.isSearchStart}
    hasError = ${store.hasError}
    hasResults = ${store.hasResults}`);
    if (store.isSearchStart) {
        console.log(`isSearch start, render`);
        $('.js-query').html(generateBreedDropDown());
    }
    else if(store.hasError) {
        console.log(`hasError, render`);
        $('.js-response').html(generateErrorHtml());
    }
    else if(store.hasResults) {
        console.log(`hasResults, render`);

    }
    else {
        console.log(`nothing to render, no change`);
        
    }
}


/* ********************
Handlers
******************** */
function handleFormSubmit() {
    $('form').submit(event => {
        event.preventDefault();
        console.log(`handleFormSubmit ran`);

        saveSearchEvent();

        let breed = $('#query').val();
        let zip = $('#zip').val();
        
        saveQuery(breed, zip);

        let hasValidBreed = validateBreed();
        let hasValidZip = validateZipCode();
        let err = '';

        if(!hasValidBreed) {
            err = 'Sorry, something went wrong. Please try your search again.';
            saveErrorEvent(err);
        }
        if(!hasValidZip) {
            err = 'Sorry, your zip code must be in the format XXXXX or XXXXX-XXXX.';
            saveErrorEvent(err);
        }
        if(hasValidBreed && hasValidZip) {
            getAdoptions();
        }
    });
}


/* ********************
On Page Load
******************** */
$(function() {
    render();
    handleFormSubmit();
});
