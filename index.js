/* ********************
Data Stores
******************** */
const dogApiKey = 'a0d7f14e-9917-471c-8876-3122563409e5';
const petFinderApiKey = '78b9651adad85f0ed7fc2ebfe786900d';
const videoApiKey = 'AIzaSyAPSmkC5hByWgmMFM6kZwCi_PScnMx68zk';
let player;

const store = {
    isSearchStart: true,
    hasError: false,
    hasResults: false,
    breedQuery: null,
    zipQuery: null,
    error: [],
    adoptions: [],
    breedDetails: {},
    videoId: null
};


/* ********************
Application Tasks
******************** */
function createPlayer() {
    player = new YT.Player('breed-video', {
        height: '200',
        width: '320',
        videoId: store.videoId,
        events: {
          'onReady': onPlayerReady
        }
      });
      console.log('player created');
}

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

function getBreedDetails() {
    console.log(`getBreedDetails ran`);
    const url = `https://api.thedogapi.com/v1/breeds/${BREEDS[store.breedQuery].breedDetailId}`;
    const options = {
    headers: new Headers({
        "X-Api-Key": dogApiKey})
    };

    return fetch(url, options)
    .then(response => response.status >= 400 ? Promise.reject('server error') : response.json())
    .then(responseJson => saveBreedDetails(responseJson))
    .catch(error => {
        alert('Something went wrong. Try again later.')
        console.log(error);

        throw(error);
    });
}

function getYouTubeVideos() {
    console.log(`getYouTubeVideos ran`);
    const videoQuery = 'dogs 101 facts ' + BREEDS[store.breedQuery].adoptionBreed;
    const params = {
      key: videoApiKey,
      q: videoQuery,
      type: 'video',
      videoEmbeddable: 'true',
      part: 'snippet',
      maxResults: 1
    };
    const queryString = formatQueryParams(params)
    const url = 'https://www.googleapis.com/youtube/v3/search' + '?' + queryString;

    console.log(url);
    return fetch(url)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then(responseJson => saveVideoId(responseJson))
      .then(startVideo())
      .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
      });
  }

function onPlayerReady(event) {
    console.log(`onPlayerReady ran`);
    event.target.playVideo();
}

function onYouTubeIframeAPIReady() {
    console.log(`onYouTubeIframeAPIReady ran`);
    if(store.hasError) {
        console.log(`iframe but has search error`);
        player;
    }
    else if(!store.hasResults) {
        console.log(`iframe but has no api results`);
        //player;
        createPlayer();
    }
    else {
        console.log('iframe and no errors, creating player');
        createPlayer();
    }
}

function saveAdoptions(responseJson) {
    const adoptList = [];
    let pet = {};
    let gender = '';

    for(let x = 0; x < responseJson.petfinder.pets.pet.length; x ++) {
        if(responseJson.petfinder.pets.pet[x].sex.$t === "F") {
            gender = 'Female';
        }
        else if(responseJson.petfinder.pets.pet[x].sex.$t === "M") {
            gender = 'Male';
        }
        else {
            gender = '';
        }

        pet = {
            name: responseJson.petfinder.pets.pet[x].name.$t,
            img: responseJson.petfinder.pets.pet[x].media.photos.photo[1].$t,
            gender,
            id: responseJson.petfinder.pets.pet[x].id.$t
        }
        adoptList.push(pet);
    }
    console.log(adoptList);

    store.hasResults = true;
    store.adoptions = adoptList;

    //render();
}

function saveBreedDetails(responseJson) {
    let breed = {
        name: responseJson.name,
        temperament: responseJson.temperament,
        breeding: responseJson.bred_for,
        height: responseJson.height.imperial,
        weight: responseJson.weight.imperial,
        life: responseJson.life_span
    };

    store.breedDetails = breed;
    
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

function saveVideoId(responseJson) {
    store.videoId = responseJson.items[0].id.videoId;
    console.log(`saved video: ${store.videoId}`);
}

function startVideo() {
    console.log(`startVideo ran`);
    //player = undefined;
    //videoId = parseVideoId();
    if (player !== undefined) {
        var x = new String(store.videoId);
    player.loadVideoById(x);
    console.log(store.videoId);
    }
    else {
    var tag = document.createElement('script');
    console.log('Player undefined');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
createPlayer();
    }
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
function generateBreedDetails() {
    let html = `<h2 class="js-breed-name">${store.breedDetails.name}</h2>
    <div id="breed-video" class="js-breed-image random-breed-image"></div>
    <ul class="js-breed-details">
        <li><span class="breed-detail">Personality:</span> ${store.breedDetails.temperament}</li>
        <li><span class="breed-detail">Originally Bred For:</span> ${store.breedDetails.breeding}</li>
        <li><span class="breed-detail">Height:</span> ${store.breedDetails.height}</li>
        <li><span class="breed-detail">Weight:</span> ${store.breedDetails.weight}</li>
        <li><span class="breed-detail">Life Span:</span> ${store.breedDetails.life}</li>
    </ul>`;

    return html;
}

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
    let html = `<p class="error">${err}</p>`;

    return html;
}

function generateResultHtml() {
    let html = `<h2>Available Adoptions Near You</h2>`;

    for(let x = 0; x < store.adoptions.length; x ++) {
        html += `<div>
        <figure>
            <figcaption>${store.adoptions[x].name} - ${store.adoptions[x].gender}</figcaption>
            <input type="image" value="${store.adoptions[x].id}" name="pet" alt="image of ${store.adoptions[x].name}" src="${store.adoptions[x].img}">
        </figure>
    </div>`;
    }
    
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
        $('.js-errors').html(generateErrorHtml());
    }
    else if(store.hasResults) {
        console.log(`hasResults, render`);
        $('.js-adoption-results').html(generateResultHtml());
        $('.js-breed-info').html(generateBreedDetails());
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
            getBreedDetails();
            //getYouTubeVideos();
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
