/* ********************
Data Stores
******************** */
const store = {
    isSearchStart: true
};


/* ********************
Application Tasks
******************** */



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



/* ********************
On Page Load
******************** */
$(function() {
    render();
});
