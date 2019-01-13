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
    hasError: false,
    hasResults: false,
    isPetPage: false, //false
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

function parsePetThumbnailImage(responseJson) {
    const thumbDetail = responseJson.petfinder.pets.pet.media.photos.photo.find(photo => photo["@size"] === 'fpm');
    const thumbObj = thumbDetail.$t;

    return thumbObj;
}

function parsePetMainImage(responseJson) {
    const imgDetail = responseJson.petfinder.pet.media.photos.photo.find(photo => photo["@size"] === 'pn');
    const imgUrl = imgDetail.$t;

    return imgUrl;
}

function saveAdoptions(responseJson) {
    const adoptList = responseJson.petfinder.pets.pet.map(x => ({
        name: x.name.$t,
        img: x.media.photos.photo[1].$t,
        gender: translateGender(x.sex.$t),
        id: x.id.$t
    }))
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

function savePetId(id) {
    store.petId = id;

    //render();
}

function savePetDetails(responseJson) {
    let petBreeds = [];
    if(Array.isArray(responseJson.petfinder.pet.breeds.breed)) {
        responseJson.petfinder.pet.breeds.breed.forEach(
            function(arrayItem) {
                petBreeds.push(arrayItem.$t)
            });
    }
    else {
        petBreeds.push(responseJson.petfinder.pet.breeds.breed.$t);
    }
    
    
    let petOptions = [];
    if(Array.isArray(responseJson.petfinder.pet.options.option)) {
        responseJson.petfinder.pet.options.option.forEach(
            function(arrayItem) {
                petOptions.push(arrayItem.$t)
            }
        );
    }
    else {
        petOptions.push(responseJson.petfinder.pet.options.option.$t);
    }
    
    
    let petDetails = {
        name: responseJson.petfinder.pet.name.$t,
        image: parsePetMainImage(responseJson),
        breed: petBreeds,
        description: responseJson.petfinder.pet.description.$t,
        age: responseJson.petfinder.pet.age.$t,
        gender: translateGender(responseJson.petfinder.pet.sex.$t),
        options: petOptions,
        contactEmail: responseJson.petfinder.pet.contact.email.$t,
        contactPhone: responseJson.petfinder.pet.contact.phone.$t
    };

    console.log(petDetails.gender);
    store.petDetails = petDetails;
    store.isPetPage = true;

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
    let html = `<section role="region" class="js-breed-info col-6">
    <h2 class="js-breed-name">About the ${store.breedDetails.name}</h2>
    <ul class="js-breed-details">
        <li><span class="breed-detail">Personality:</span> ${store.breedDetails.temperament}</li>
        <li><span class="breed-detail">Originally Bred For:</span> ${store.breedDetails.breeding}</li>
        <li><span class="breed-detail">Height:</span> ${store.breedDetails.height} inches</li>
        <li><span class="breed-detail">Weight:</span> ${store.breedDetails.weight} inches</li>
        <li><span class="breed-detail">Life Span:</span> ${store.breedDetails.life}</li>
    </ul>
    </section>`;

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
    let html = `<section role="region" class="js-errors row">
    <p class="error">${err}</p>
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
                <li>Phone Number: ${store.petDetails.contactPhone !== undefined ? store.petDetails.contactPhone : 'Not Provided'}</li>
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

function generateResponseHtml() {
    let breedHtml = generateBreedDetails();
    let adoptionHtml = generateResultHtml();
    return (breedHtml + adoptionHtml);
}

function generateResultHtml() {
    let html = `<section role="region" class="js-adoption-results col-6">
    <h2>Available Adoptions Near You</h2>`;

    for(let x = 0; x < store.adoptions.length; x ++) {
        html += `<div>
        <figure>
            <figcaption>${store.adoptions[x].name} - ${store.adoptions[x].gender}</figcaption>
            <input type="image" value="${store.adoptions[x].id}" class="js-pet-link" name="pet" alt="image of ${store.adoptions[x].name}" src="${store.adoptions[x].img}">
        </figure>
    </div>`;
    }
    html += `</section>`;

    return html;
}


/* ********************
HTML Render
******************** */
function render() { 
    /*render() {
  renderMessages();
  renderBreedDetails();
  renderBreedVideo();
  renderAdoptions(); 
}*/
    console.log(`Application state:
    isSearchStart = ${store.isSearchStart}
    hasError = ${store.hasError}
    hasResults = ${store.hasResults}
    isPetPage = ${store.isPetPage}`);
    if (store.isSearchStart) {
        console.log(`isSearch start, render`);
        $('.js-query').html(generateBreedDropDown());
    }
    else if(store.hasError) {
        console.log(`hasError, render`);
        $('.js-response').html(generateErrorHtml());
    }
    else if(store.isLoading) {
        //TODO will show when we're still loading. Will need to make sure you clear out any adoptions, etc html
        renderMessages();
    }
    else if(store.isPetPage) {
        console.log('isPetPage, render');
        $('.js-response').html(generatePetDetailHtml());
    }
    else if(store.hasResults) {
        console.log(`hasResults, render`);
        //TODO renderBreedDetails(), renderAdoption(), rednerBreedVideo()**this one is special. The div already exists in html.
        $('.js-response').html(generateResponseHtml());
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

        const breed = $('#query').val();
        const zip = $('#zip').val();
        //TODO Perhaps saveSearchEvent and saveQuery can be combined
        saveQuery(breed, zip);

        if(!validateBreed()) {
            saveErrorEvent('Sorry, something went wrong. Please try your search again.');
        }
        else if(!validateZipCode()) {
            saveErrorEvent('Sorry, your zip code must be in the format XXXXX or XXXXX-XXXX.');
        }
        else {
            getAdoptions()
            getBreedDetails();
            ;
            //getYouTubeVideos();
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


/* ********************
On Page Load
******************** */
$(function() {
    render();
    handleFormSubmit();
    handlePetClick();
});
