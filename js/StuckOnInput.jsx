// Component for input of Twitter handle
var TwitterInput = React.createClass({
    componentDidMount: function() {
        // Focus on the input button when the page loads
        this.refs.nameInput.focus()
    },
    _handleKeyPress: function(e) {
        // Call the onSubmit event when enter is pressed
        if (e.key === 'Enter') {
            if (this.refs.nameInput.value) {
                this.props.onSubmit(this.refs.nameInput.value);
            }
        }
    },
    render: function() {
        return (
            <div className="statusInput">
                <h2>What is your Twitter username?</h2>
                <input type = "text" onKeyPress = {this._handleKeyPress} placeholder="@YourTwitterUsername" ref="nameInput" />
            </div>
        )
    }
});

// Component for input of Status
var StatusInput = React.createClass({
    // Focus on the input button when the page loads
    componentDidMount: function() {
        this.refs.statusInput.focus();
    },
    _handleKeyPress: function(e) {
        // Call the onSubmit event when enter is pressed
        if (e.key === 'Enter') {
            if (this.refs.statusInput.value) {
                this.props.onSubmit(this.refs.statusInput.value);
                this.refs.statusInput.value = "";
            }
        }
    },
    render: function() {
        return (
            <div className="statusInput">
                <h2>I am stuck on </h2>
                <input type = "text" onKeyPress = {this._handleKeyPress} placeholder={this.props.placeholder} ref="statusInput" />
            </div>
        )
    }
});

var StuckOnInput = React.createClass({

    // Checks if localstorage already exists otherwise update it with default value
    getInitialState: function() {
        var self = this
        let status
        let twitterHandle

        // Get the Appbase credentials from the config file
        // Note that this will be executed as async process
        $.getJSON("./config.json", function(json) {
            // Create Appbase reference object
            self.appbaseRef = new Appbase({
                url: 'https://scalr.api.appbase.io',
                appname: json.appbase.appname,
                username: json.appbase.username,
                password: json.appbase.password
            });
            self.type = json.appbase.type
        });

        // If there is twitter handle in localstorage, get it and use that as default
        // Also, get the status from the localstorage to show as the placeholder
        if (localStorage.state) {
            status = JSON.parse(localStorage.state).status
            twitterHandle = JSON.parse(localStorage.state).twitterHandle
        }
        // Setting the status with default Value
        else {
            status = "Mining Bitcoin"
            twitterHandle = ""
        }
        return {
            status: status,
            twitterHandle: twitterHandle
        };
    },

    // Update the localStorage when state is changed
    componentDidUpdate: function(prevProps, prevState) {
        localStorage.state = JSON.stringify(this.state);
    },

    // Index the status to Appbase
    addInputToAppbase: function(status) {
        // Set the status state with the argument passed with the function
        this.setState({
            status: status
        });
        var data = {
            "status": status,
            "twitterHandle": this.state.twitterHandle,
            "timestamp": Date.now()
        }
        this.appbaseRef.index({
            type: this.type,
            body: data,
        }).on('data', function(response) {
            console.log(response);
        }).on('error', function(error) {
            console.log(error);
        });
    },

    // Update the Twitter Handle state when the TwitterInput component is submitted
    setTwitterHandle: function(twitterHandle) {
        this.setState({
            twitterHandle: twitterHandle
        });
    },

    render: function() {
        var twitterHandle = ""

        // If twitterHandle is already set in localStorage, then show update status page directly
        if (this.state.twitterHandle) {
            return (
                <StatusInput onSubmit={this.addInputToAppbase} placeholder={this.state.status}/>
            );
        } else {
            return (
                <TwitterInput onSubmit={this.setTwitterHandle} />
            );
        }
    }

});

ReactDOM.render(
    <StuckOnInput />,
    document.getElementById('stuckOnInput')
);