FindMyFurryFriend "fmff"

Live Application: https://travelingtonic.github.io/fyff/


/* Functional Stories */


Generate breed search list

onYouTubeIframeAPIReady, create youtube player

Render start screen (STATE: Search Start)

Watch for form submit

Watch for pet click

Watch for back to results click

    On form submit,
        (STATE: Loading) save form values
        clean up store by removing saved query error, api error, adoption list, youtube video, breed details, and adoption details
        check for valid breed
            if breed invalid, (STATE: Search Error) save error
        check for valid zip
            if zip invalid, (STATE: Search Error) save error
                if form invalid,
                    THEN generate error
                        THEN render error
                if form valid, get adoption list
                    if no adoptions, (STATE: API Error) get error
                        THEN save error
                            THEN generate error
                                THEN render error
                    if adoptions, save adoption list
                    THEN 
                        get Youtube video Id
                            THEN save Youtube video Id
                        get breed details
                            THEN save breed details
                    THEN (STATE: Results)
                        THEN generate adoption list
                        generate Youtube video
                        generate breed details
                            THEN render adoption results
                                THEN render breed video
                                render breed detail
        On adoption click,
            (STATE: Adoption Detail)
            get adoption detail
                THEN save adoption detail
                    THEN generate adoption detail
                        THEN render adoption detail
        On detail back click,
            (STATE: Results)
            generate adoption list
            generate Youtube video
            generate breed details
                THEN render adoption results
                    THEN render breed video
                    render breed detail


/* Feature Requests */

Loading screen so users know their search request is being processed (COMPLETED: Added loading state)

Details of each adoption so users can see a description and contact information for a furry friend they're interested in (COMPLETED: Added pet detail view)

More breed information so users can find their perfect breed (COMPLETED: Added youtube videos of breed facts)

Paging so you can see more adoption results

Filtering so you can see only specific results (by age, by gender, etc)

Breed categories so you can find dogs in breeds that match certain household situations or personality needs (family friendly, guardian, companion, etc)
