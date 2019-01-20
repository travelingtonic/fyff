/* ********************
TODO Speak to your technical decisions and tradeoffs
******************** */

/* ********************
Data Stores
******************** */
const dogApiKey = 'a0d7f14e-9917-471c-8876-3122563409e5';
const petFinderApiKey = '78b9651adad85f0ed7fc2ebfe786900d';
const videoApiKey = 'AIzaSyAPSmkC5hByWgmMFM6kZwCi_PScnMx68zk';
let player;

const store = {
    isSearchStart: true, //true
    isLoading: false,
    hasError: false,
    hasAdoptions: false,
    isOnResultView: false,
    isOnPetView: false, //false
    breedQuery: null,
    zipQuery: null,
    error: [],
    adoptions: [],
    breedDetails: {},
    videoId: null,
    petId: null, //43657126
    petDetails: []
};


/* ********************
Application Tasks
******************** */
function createPlayer() {
    player = new YT.Player('breed-video', {
        height: '200',
        width: '250',
        videoId: store.videoId,
        events: {
            'onReady': onPlayerReady
        }
    });
    console.log('player created');
}

function destroyYouTubeVideo() {
    if(player !== undefined) {
        player.stopVideo();
        //$('.js-breed-video').addClass('hidden');
        $('.js-breed-video').hide();
        //player.destroy();
    }
    else {
        $('.js-breed-video').html('');
    }
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
            count: "20",
            breed: query,
            location: store.zipQuery
        };
        const queryString = formatQueryParams(params);
        const url = 'https://api.petfinder.com/pet.find?' + queryString + '&callback=?';
        console.log(url);
        //Note: We're using getJSON per PetFinder's api docs re:cross-domain https://www.petfinder.com/developers/api-docs#methods
        return $.getJSON(url).then(function checkAdoptionResults(responseJson) {
            console.log(`checking for adoption results`);
            let err = '';
            if(responseJson.petfinder.hasOwnProperty('pets')) {
                if(responseJson.petfinder.pets.hasOwnProperty('pet') && responseJson.petfinder.pets.pet !== undefined && responseJson.petfinder.pets.pet !== null) {
                    console.log(`We have adoption records`);
                    saveAdoptions(responseJson);
                }
                else {
                    console.log(`We do not have adoption results`);
                    err = "Sorry, we couldn't find any adoptions. Please try another search.";
                    saveErrorEvent(err);
                    //Promise.reject(new Error(err));
                    throw new Error(err);
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
        }).catch(err => {return Promise.reject(new Error(err))})  //.catch(err => {console.log(`Error on adoption get: ${err}`)})
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

function getPetDetails() {
    console.log(`getPetDetails ran`);
        const params = {
            key: petFinderApiKey,
            format: "json",
            id: store.petId
        };
        const queryString = formatQueryParams(params);
        const url = 'https://api.petfinder.com/pet.get?' + queryString + '&callback=?';
        console.log(`Pet Id: ${store.petId}`);
        //Note: We're using getJSON per PetFinder's api docs re:cross-domain https://www.petfinder.com/developers/api-docs#methods
        return $.getJSON(url).then((responseJson) => savePetDetails(responseJson))
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
        .catch(err => {
            $('#js-message').text(`Something went wrong: ${err.message}`);
        });
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function parsePetBreeds(breedList) {
    let petBreeds = [];
    if(Array.isArray(breedList)) {
        breedList.forEach(
            function(arrayItem) {
                petBreeds.push(arrayItem.$t)
            });
    }
    else {
        petBreeds.push(breedList.$t);
    }

    return petBreeds;
}

function parsePetThumbnailImage(media) {
    let thumbDetail = '';
    let thumbUrl = '';

    if(isEmpty(media)) {
        thumbUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Littlebluedog.svg/64px-Littlebluedog.svg.png';
      }
      else {
        thumbDetail = media.photos.photo.find(photo => photo["@size"] === 'fpm');
        thumbUrl = thumbDetail.$t;
      }

    return thumbUrl;
}

function parsePetMainImage(media) {
    let imgDetail = '';
    let imgUrl = '';

    if(isEmpty(media)) {
        imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Littlebluedog.svg/64px-Littlebluedog.svg.png';
    }
    else {
        imgDetail = media.photos.photo.find(photo => photo["@size"] === 'pn');
        imgUrl = imgDetail.$t;
    }

    /*if(responseJson.petfinder.pets.pet.media.hasOwnProperty('photos') && responseJson.petfinder.pets.pet.media.photos !== undefined && responseJson.petfinder.pets.pet.media.photos !== null) {
        imgDetail = responseJson.petfinder.pet.media.photos.photo.find(photo => photo["@size"] === 'pn');
        imgUrl = imgDetail.$t;
    }
    else {
        imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Littlebluedog.svg/64px-Littlebluedog.svg.png';
    }*/

    return imgUrl;
}

function parsePetOptions(optionList) {
    let petOptions = [];
    if(Array.isArray(optionList)) {
        optionList.forEach(
            function(arrayItem) {
                petOptions.push(arrayItem.$t)
            }
        );
    }
    else {
        if(isEmpty(optionList)) {
            petOptions.push(`none`);
        }
        else {
            petOptions.push(optionList.$t);
        }
    }

    return petOptions;
}

function saveAdoptions(responseJson) {
    const adoptList = responseJson.petfinder.pets.pet.map(x => ({
        name: x.name.$t,
        img: parsePetThumbnailImage(x.media),
        gender: translateGender(x.sex.$t),
        id: x.id.$t
    }))
    console.log(adoptList);

    store.adoptions = adoptList;
    store.hasAdoptions = true;
    
    //store.isLoading = false;
    //store.isOnResultView = true; //TODO to move this to the breed detail save

    render();
}

function saveBackToResultsEvent() {
    store.petId = null;
    store.isOnPetView = false;
    store.isOnResultView = true;

    render();
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
    store.isLoading = false;
    store.hasAdoptions = false;
    store.hasError = true;
    store.error.push(err);

    render();
}

function savePetId(id) {
    store.petId = id;

    render();
}

function savePetDetails(responseJson) {
    let petDetails = {
        name: responseJson.petfinder.pet.name.$t,
        image: parsePetMainImage(responseJson.petfinder.pet.media),
        breed: parsePetBreeds(responseJson.petfinder.pet.breeds.breed),
        description: responseJson.petfinder.pet.description.$t !== undefined ? responseJson.petfinder.pet.description.$t : "I'm waiting for my forever friend. Please reach out to my contact for more info about me!",
        age: responseJson.petfinder.pet.age.$t,
        gender: translateGender(responseJson.petfinder.pet.sex.$t),
        options: parsePetOptions(responseJson.petfinder.pet.options.option),
        contactEmail: responseJson.petfinder.pet.contact.email.$t !== undefined ? responseJson.petfinder.pet.contact.email.$t : 'Not Provided',
        contactPhone: responseJson.petfinder.pet.contact.phone.$t !== undefined ? responseJson.petfinder.pet.contact.phone.$t : 'Not Provided'
    };

    console.log(petDetails.gender);
    store.petDetails = petDetails;

    store.isOnResultView = false;
    store.isOnPetView = true;

    render();
}

function saveResultEvent() {
    store.isLoading = false;
    store.isOnResultView = true;

    render();
}

function saveSearchEvent(breed, zip) {
    store.error = [];
    store.adoptions = [];
    store.breedDetails = {};
    store.petDetails = [];
    store.petId = null;
    store.videoId = null;

    store.breedQuery = breed;
    store.zipQuery = zip;

    store.isSearchStart = false;
    store.isLoading = true;
    store.hasError = false;
    store.isOnResultView = false;

    render();
}

function saveVideoId(responseJson) {
    store.videoId = responseJson.items[0].id.videoId;
    console.log(`saved video: ${store.videoId}`);

    render();
}

function startVideo() {
    console.log(`startVideo ran`);
    if (player !== undefined) {
        var x = new String(store.videoId);
        player.loadVideoById(x);
        console.log('Player defined');
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

function translateGender(sex) {
    return (sex === 'F' ? 'Female' : sex === 'M' ? 'Male' : '');
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
    let html = `
    <ul class="js-breed-details">
        <li><span class="breed-detail">Personality:</span> ${store.breedDetails.temperament}</li>
        <li><span class="breed-detail">Originally Bred For:</span> ${store.breedDetails.breeding}</li>
        <li><span class="breed-detail">Height:</span> ${store.breedDetails.height} inches</li>
        <li><span class="breed-detail">Weight:</span> ${store.breedDetails.weight} inches</li> <!--TODO fix UOM -->
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

function generateBreedName() {
    return (`<h2 class="js-breed-name">About the ${store.breedDetails.name}</h2>`);
}

function generateErrorHtml() {
    let err = store.error.join(`</p><p class="js-error-message error">`);
    let html = `<section role="region" class="js-error row error-container">
    <p class="js-error-message error">${err}</p>
    </section>`;

    return html;
}

function generateLoadingHtml() {
    let html = `<section role="region" class="js-loading row loading-container">
    <p class="js-loading-message">Fetching...</p>
    </section>`;

    return html;
}

function generatePetDetailHtml() {
    let breeds;

    if(store.petDetails.breed.length > 1) {
        breeds = store.petDetails.breed.join(', ');
    }
    else {
        breeds = store.petDetails.breed[0];
    }
    const html = `
        <div>
            <button class="js-back-link link"><< Back to Results</button>
            <img src="${store.petDetails.image}" alt="Image of ${store.petDetails.name}">
            <div>
                <h2>Meet ${store.petDetails.name}</h2>
                <ul>
                    <li>${breeds}</li>
                    <li>${store.petDetails.age}</li>
                    <li>${store.petDetails.gender}</li>
                    ${generatePetDetailOptionsHtml()}
                </ul>
            </div>
            <p>${store.petDetails.description}</p>
            <h2>Contact Information</h2>
            <ul>
                <li>Phone Number: ${store.petDetails.contactPhone}</li>
                <li>Email Address: ${store.petDetails.contactEmail !== undefined ? store.petDetails.contactEmail : 'Not Provided'}</li>
            </ul>
        </div>
    `;

return html;
}

function generatePetDetailOptionsHtml() {
    let homeDetails = store.petDetails.options;
    let html = '';
    
    homeDetails.forEach(function(value, index) {
        if (value === 'none') store.petDetails.options[index] = '<li>Find out more about me from my contact below!</li>';
        if (value === 'housetrained') store.petDetails.options[index] = '<li>House-trained: Yes</li>';
        if (value === 'altered') store.petDetails.options[index] = '<li>Spayed/Neutered: Yes</li>';
        if (value === 'hasShots') store.petDetails.options[index] = '<li>Health: Vaccinations up to date</li>';
        if (value === 'noKids') store.petDetails.options[index] = '<li>Good in home with older kids or no kids</li>';
        if (value === 'noDogs') store.petDetails.options[index] = '<li>Good in home with no other dogs</li>';
        if (value === 'noCats') store.petDetails.options[index] = '<li>Good in home with no cats</li>';
    });
    html = homeDetails.join('\n\t');

    return html;
}
/*
function generateResponseHtml() {
    let breedHtml = generateBreedDetails();
    let adoptionHtml = generateResultHtml();
    return (breedHtml + adoptionHtml);
}
*/

function generateResultHtml() {
    let html = `
    <h2>Available Adoptions Near You</h2>`;

    for(let x = 0; x < store.adoptions.length; x ++) {
        html += `<div>
        <figure>
            <figcaption>${store.adoptions[x].name} - ${store.adoptions[x].gender}</figcaption>
            <input type="image" value="${store.adoptions[x].id}" class="js-pet-link" name="pet" alt="image of ${store.adoptions[x].name}" src="${store.adoptions[x].img}">
        </figure>
    </div>`;
    }

    return html;
}


/* ********************
HTML Render
******************** */
function render() {
    renderBreedDropDown();
    renderMultiViewContent();
    renderSingleViewContent();
}

function renderAdoptions() {
    $('.js-adoption-results').html(generateResultHtml());
}

function renderBreedDetails() {
    $('.js-breed-details').html(generateBreedDetails());
}

function renderBreedDropDown() {
    if (store.isSearchStart) {
        console.log(`isSearch start, render`);
        $('.js-query').html(generateBreedDropDown());
    }
    else {
        console.log(`isSearch already started, no change to render`);
    }
}

function renderBreedName() {
    $('.js-breed-name').html(generateBreedName());
}

function renderBreedVideo() {
    $('.js-breed-video').show();
    startVideo();
}

function renderMultiViewContent() {
    if(store.isOnResultView) {
        console.log(`isOnResultView, render`);
        renderBreedName();
        renderBreedDetails();
        renderBreedVideo();
        renderAdoptions();
    }
    else {
        destroyYouTubeVideo();
        $('.js-breed-name').html('');
        $('.js-breed-details').html('');
        $('.js-adoption-results').html('');
    }
}

function renderSingleViewContent() {
    if(store.hasError) {
        console.log(`hasError, render`);
        $('.js-message').html(generateErrorHtml());
    }
    else if(store.isOnPetView) {
        console.log('isOnPetView, render');
        $('.js-message').html(generatePetDetailHtml());
    }
    else if (store.isLoading) {
        console.log('isLoading, render');
        $('.js-message').html(generateLoadingHtml());
    }
    else {
        $('.js-message').html('');
    }
}


/* ********************
Handlers
******************** */
function handleBackClick() {
    $('.js-message').on('click', '.js-back-link', function(event) {
        console.log(`handleBackClick ran`);

        saveBackToResultsEvent();
    });
}

function handleFormSubmit() {
    $('form').submit(event => {
        event.preventDefault();
        console.log(`handleFormSubmit ran`);

        const breed = $('#query').val();
        const zip = $('#zip').val();

        saveSearchEvent(breed, zip);

        if(!validateBreed()) {
            console.log(`search breed invalid`);
            saveErrorEvent('Sorry, something went wrong. Please try your search again.');
        }
        else {
            if(!validateZipCode()) {
                console.log(`search zip invalid`);
                saveErrorEvent('Your zip code must be in the format XXXXX or XXXXX-XXXX. Please try your search again.');
            }
            else {
                console.log(`Everything's good with the search`);
                /*getAdoptions();

                if(store.hasAdoptions) {
                Promise.all([getBreedDetails(),getYouTubeVideos()])
                    .then(() => saveResultEvent())
                    .catch(function(err) {
                        console.log(err);
                      });*/
                Promise.all([getAdoptions(), getBreedDetails(), getYouTubeVideos()]).then(() => saveResultEvent())
                .catch(error => {
                    console.log(error);
                });
            }
            /*else {
                console.log(`No adoptions to show so not re-rendering`);
            }
        }*/
        }
    });
}

function handlePetClick() {
    $('.js-response').on('click', '.js-pet-link', function(event) {
        console.log(`handlePetClick ran`);
        
        const pet = $(this).val();

        savePetId(pet);

        getPetDetails();
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
    else if(!store.isOnResultView) {
        console.log(`iframe but has no api results`);
        player;
    }
    else {
        console.log('iframe and no errors, creating player');
        createPlayer();
    }
}


/* ********************
On Page Load
******************** */
$(function() {
    handleFormSubmit();
    handlePetClick();
    handleBackClick();

    render(); //TODO: Create a default state for render (requires defaulting all set stores) so that we don't need the isSearchStart state.
});
