// Render a single item of the Feed
var FeedItem = React.createClass({
    render: function() {
        // Get the profile picture from Twitter using the given handle
        let twitterProfilePictureURL = "https://twitter.com/" + this.props.item.twitterHandle + "/profile_image?size=original"
        return (
            <div className="row">
                <div className="col s4 m2 l1">
                    <img className="profile-picture" src={twitterProfilePictureURL}/>
                </div>
                <div className="col s8 m10 l11">
                    <span className="twitter-handle">{this.props.item.twitterHandle} is</span>
                    <p className="stuck-on-feed">{this.props.item.status}</p>
                </div>
            </div>
        );
    }
})

// Collection of the items of the feed
var FeedContainer = React.createClass({
    render: function() {
        var content
            // Loop through all the items
        if (this.props.items.length > 0) {
            content = this.props.items.map(function(item) {
                return <FeedItem item={item} />
            });
        } else {
            content = <FeedItem item="No content Available!" />
        }

        return (
            <div className="row">
                <h3 className="col s12 center white-text"> Stuck On Feed</h3>
                {content}
            </div>
        );
    }
})

// Fetch the data from Appbase and renders FeedContainer
// Handles the infinite scrolling of the Feed
// Listen to Realtime updates
var StuckOnFeed = React.createClass({

    getInitialState: function() {
        var self = this;

        // Get the Appbase credentials from the config file
        // Note that this will be executed as async process
        $.getJSON("./config.json", function(json) {
            // Create Appbase reference object
            self.appbaseRef = new Appbase({
                url: 'https://scalr.api.appbase.io',
                appname: json.appbase.app_name,
                username: json.appbase.username,
                password: json.appbase.password
            });
            self.type = json.appbase.type
            self.pageNumber = 0
            self.getHistoricalFeed()
            self.subscribeToUpdates()
        });

        return {
            items: []
        };
    },

    // Fetch the old status from Appbase based on pageNumber
    getHistoricalFeed: function() {
        self = this
        self.appbaseRef.search({
            type: self.type,
            size: 10,
            from: self.pageNumber * 10,
            body: {
                query: {
                    match_all: {}
                },
                sort: {
                    timestamp: "desc"
                }
            }
        }).on('data', function(res) {
            self.pageNumber = self.pageNumber + 1
            self.addItemsToFeed(res.hits.hits)
        }).on('error', function(err) {
            console.log("search error: ", err);
        })
    },

    // Add the items to the feed fetched in getHistorialFeed
    addItemsToFeed: function(newItems) {
        var updated = this.state.items;
        $.map(newItems, function(object) {
            updated.push(object._source)
        })
        this.setState({
            items: updated
        });
    },

    // For the Infinite scrolling
    componentDidMount: function() {
        window.addEventListener('scroll', this.handleScroll)
    },
    componentWillUnmount: function() {
        window.removeEventListener('scroll', this.handleScroll)
    },

    // Fired when client scrolls the page
    handleScroll: function(event) {
        var body = event.srcElement.body
            // When the client reaches at the bottom of the page, get next page     
        if (body.clientHeight + body.scrollTop >= body.offsetHeight) {
            this.getHistoricalFeed()
        }
    },
    // Listen to realtime updates in Appbase and then add it to the top of the feed
    subscribeToUpdates: function() {
        self.appbaseRef.searchStream({
            type: "feed",
            body: {
                query: {
                    match_all: {}
                }
            }
        }).on('data', function(res) {
            self.addItemToTop(res._source)
        }).on('error', function(err) {
            console.log("streaming error: ", err);
        })
    },

    // Add the realtime status to the top
    addItemToTop: function(newItem) {
        var updated = this.state.items;
        updated.unshift(newItem)
        this.setState({
            items: updated
        });
    },

    render: function() {
        return (
            <FeedContainer items={this.state.items}/>
        );
    }

});

ReactDOM.render(
    <StuckOnFeed />,
    document.getElementById('stuckOnFeed')
);