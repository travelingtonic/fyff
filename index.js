/* ********************
Data Stores
******************** */
const store = {
    isSearchStart: true,
    hasQueryError: false,
    breedQuery: null,
    zipQuery: null,
    queryErr: []
};


/* ********************
Application Tasks
******************** */
function processForm() {
    console.log(`processForm ran
    breed: ${store.breedQuery}
    zip: ${store.zipQuery}
    valid zip code?: ${validateZipCode()}`);

    if(validateBreed()) {
        store.hasQueryError = false;
    }
    else {
        store.hasQueryError = true;
        store.queryErr.push('Sorry, something went wrong. Please try your search again.');
    }

    if(validateZipCode()) {
        store.hasQueryError = false;
    }
    else {
        store.hasQueryError = true;
        store.queryErr.push('Sorry, your zip code must be in the format XXXXX or XXXXX-XXXX.')
    }
    console.log(`Query Error?: ${store.hasQueryError}
    Query Error Messages: ${store.queryErr}`);
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


/* ********************
HTML Render
******************** */
function render() { 
    console.log(`Application state:
    isSearchStart = ${store.isSearchStart}`);
    if (store.isSearchStart) {
        console.log(`isSearch start, render`);
        $('.js-query').html(generateBreedDropDown());
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
        //TODO: split into a save function
        store.breedQuery = $('#query').val();
        store.zipQuery = $('#zip').val();
        store.isSearchStart = false;
        processForm();
    });
}


/* ********************
On Page Load
******************** */
$(function() {
    render();
    handleFormSubmit();
});
