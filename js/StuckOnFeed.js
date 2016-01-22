var FeedItem = React.createClass({
	render: function() {
		twitterProfilePictureURL = "https://twitter.com/" + this.props.item.twitterHandle + "/profile_image?size=original"
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

var FeedItems = React.createClass({
	render: function() {

		var content;
		if (this.props.items.length > 0) {
		  content = this.props.items.map(function(item) {
		    return <FeedItem item={item} />;
		  });
		} else {
		  content = <FeedItem item="No content Available!" />;
		}

		return (
			<div className="row">
				<h3 className="col s12 center white-text"> Stuck On Feed</h3>
				{content}
			</div>
		);
	}
})

var StuckOnFeed = React.createClass({

	getDefaultProps: function() {
		return {
			pageNumber: 0
		};
	},
	getInitialState: function() {
		var self = this;

		// Get the Appbase credentials from the config file
		// Note that this will be executed as async process
		$.getJSON("./config.json", function(json) {
			// Create Appbase reference object
			self.props.appbaseRef = new Appbase({
				  url: 'https://scalr.api.appbase.io',
				  appname: json.appbase.app_name,
				  username: json.appbase.username,
				  password: json.appbase.password
			});
			self.props.type = json.appbase.type	
			self.getHistoricalFeed()
			self.subscribeToUpdates()	
		});

		return {
			items: [] 
		};
	},
	componentDidMount: function() {
		window.addEventListener('scroll', this.handleScroll)
	},
	componentWillUnmount: function() {
		window.removeEventListener('scroll', this.handleScroll)
	},
	handleScroll: function(event) {
		var body = event.srcElement.body
		var self = this
		if(body.clientHeight + body.scrollTop >= body.offsetHeight) {
			this.getHistoricalFeed()
		}
	},
	addItemToTop: function(newItem){
		var updated = this.state.items;
		updated.unshift(newItem)
		this.setState({items: updated});
	},
	getHistoricalFeed: function(){
		self = this
		self.props.appbaseRef.search({
			type: "feed",
		  	size: 10,
		  	from: self.props.pageNumber*10,
			body: {
			    query: {
			      match_all: {}
			    },
			    sort: {
			    	timestamp: "desc"
			    }
			  }
			}).on('data', function(res) {
				self.props.pageNumber = self.props.pageNumber + 1
				self.addItemsToFeed(res.hits.hits)
			}).on('error', function(err) {
			  console.log("search error: ", err);
		})
	},
	subscribeToUpdates: function(){
		self.props.appbaseRef.searchStream({
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
	addItemsToFeed: function(newItems){
		var updated = this.state.items;
		$.map(newItems, function(object){
			updated.push(object._source)
		})
		this.setState({items: updated});
	},
	render: function() {
		return (
			<FeedItems items={this.state.items}/>
		);
	}

});

React.render(
  <StuckOnFeed />,
  document.getElementById('stuckOnFeed')
);