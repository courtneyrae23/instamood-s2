var INSTA_API_BASE_URL = "https://api.instagram.com/v1";
var SENTIMENT_API_URL = "https://twinword-sentiment-analysis.p.mashape.com/analyze/"
var SENTIMENT_API_KEY = "CjiIwKWCwkmshdrP5qLRpdtog6I4p1hxHNQjsnVV6mVaKT9EBr";
var CLARIFAI_API_BASE_URL = "https://api.clarifai.com/v1/tag/";
var CLARIFAI_COLOR_BASE_URL = "https://api.clarifai.com/v1/color/"
var CLARIFAI_API_ID = "zJClJTD5lHVflZ9KyhFcbDW2U2LOHnVYlDLkLltl";
var CLARIFAI_API_SECRET = "4wSFfND_lEMrXMS83jPpA7GhFpq7ciYnjA1KpOOc";
var CLARIFAI_API_TOKEN = "9coLi11j54k9tfxAyeRzRUtmjJTSIF";
var app = angular.module('Instamood',[]);



app.controller('MainCtrl', function($scope, $http) {

	$scope.userStats = [];
  // get the access token if it exists
	$scope.hasToken = true;
	var token = window.location.hash;
	if (!token) {
	    $scope.hasToken = false;
	}
	token = token.split("=")[1];

	$scope.getInstaPics = function() {
	    var path = "/users/self/media/recent";
	    var mediaUrl = INSTA_API_BASE_URL + path;
	    $http({
	    	method: "JSONP",
	    	url: mediaUrl,
	    	params: {
	    		callback: "JSON_CALLBACK",
	    	// you need to add your access token here, as per the documentation
	    		access_token: token
	    	}
	  	}).then(function(response) {
	    	$scope.picArray = response.data.data;
	        // now analyze the sentiments and do some other analysis
	        // on your images
	        analyzeSentiments();
	        userStats();
	        getImageContents();


	        $scope.currentObject = $scope.userStats[0];
			$scope.firstItem = true;
			$scope.lastItem = false;

			$scope.getPrev = function() {
				var index = $scope.userStats.indexOf($scope.currentObject);
				$scope.currentObject = $scope.userStats[index-1];
				$scope.firstItem = (index-1 === 0);
				$scope.lastItem = false;
			}

			$scope.getNext = function() {
				var index = $scope.userStats.indexOf($scope.currentObject);
				console.log(index);
				$scope.currentObject = $scope.userStats[index+1];
				console.log(index);
				$scope.firstItem = false;
				$scope.lastItem = (index+1 === $scope.userStats.length-1);
			}


	    });
	};

	$scope.getInstaPics();

	$scope.optionData = {
    	options: [
		    {id: '0', name: 'Most Recent', command: '-created_time'},
		    {id: '1', name: 'Least Recent', command: '+created_time'},
		    {id: '2', name: 'Most Positive', command: '-positivity'},
		    {id: '3', name: 'Least Positive', command: '+positivity'}
    	],
    	selectedOption: {id: '0', name: 'Most Recent', command: '-created_time'}
    };


   	var analyzeSentiments = function() {
    // when you call this function, $scope.picArray should have an array of all 
    // your instas. Use the sentiment analysis API to get a score of how positive your 
    // captions are
    	$scope.totalPositive = 0;
    	for (var i = 0; i < $scope.picArray.length-1; i++) {
    		$scope.positivity = [];
    		$scope.text = [];
			$http({
			    method: "GET",
			    url: SENTIMENT_API_URL,
			    headers: { 'X-Mashape-Key': SENTIMENT_API_KEY },
			    params: { 'text': $scope.picArray[i].caption.text}
			}).then(function(response) {
				checkCaptions(response.config.params.text, response.data.score);
			});
		};
		// Call average function on last iteration
	    $scope.positivity = [];
		$scope.text = [];
		$http({
		    method: "GET",
		    url: SENTIMENT_API_URL,
		    headers: { 'X-Mashape-Key': SENTIMENT_API_KEY },
		    params: { 'text': $scope.picArray[$scope.picArray.length-1].caption.text}
		}).then(function(response) {
			checkCaptions(response.config.params.text, response.data.score);
			$scope.userStats.push({title: 'Positivity', value: Math.floor($scope.avgPos * 100) / 100});
		});
	};

	var checkCaptions = function(text, score) {
		for (var i = 0; i < $scope.picArray.length; i++) {
			if (text === $scope.picArray[i].caption.text) {
				$scope.picArray[i].positivity = score;
				$scope.totalPositive += score;
			};
		};

		$scope.avgPos = $scope.totalPositive / $scope.picArray.length;
	};

	var userStats = function() {
		var numLikes = 0;
		var activeDays = [0,0,0,0,0,0,0];
		var numWords = 0;
		var numHashTags = 0;
		var numOwnLiked = 0;

		for (var i = 0; i < $scope.picArray.length; i++) {
			numLikes += $scope.picArray[i].likes.count;
			numWords += $scope.picArray[i].caption.text.split(" ").length;
			numHashTags += $scope.picArray[i].tags.length;
			if ($scope.picArray[i].user_has_liked) {
				numOwnLiked++;
			}
			var day = new Date($scope.picArray[i].created_time * 1000);
			activeDays[day.getDay()] += 1;
		};

		$scope.userStats.push({title: 'Brevity', value: numWords / $scope.picArray.length});
		$scope.userStats.push({title: 'Popularity', value: numLikes / $scope.picArray.length});
		$scope.userStats.push({title: 'Visibility Thirst', value: numHashTags / $scope.picArray.length});
		$scope.userStats.push({title: 'Ego Score', value: (numOwnLiked / $scope.picArray.length) * 100});

		switch(activeDays.indexOf(Math.max(...activeDays))) {
			case 0:
				$scope.userStats.push({title: "Most Active Day", value: "Sunday"});
				break;
			case 1:
				$scope.userStats.push({title: "Most Active Day", value: "Monday"});
				break;
			case 2:
				$scope.userStats.push({title: "Most Active Day", value: "Tuesday"});
				break;
			case 3:
				$scope.userStats.push({title: "Most Active Day", value: "Wednesday"});
				break;
			case 4:
				$scope.userStats.push({title: "Most Active Day", value: "Thursday"});
				break;
			case 5:
				$scope.userStats.push({title: "Most Active Day", value: "Friday"});
				break;
			case 6:
				$scope.userStats.push({title: "Most Active Day", value: "Saturday"});
				break;
		};
	};

	var findMax = function(object) {
		var maxItem;
		var maxVal = 0;
		for (var tag in object) {
			if (object[tag] > maxVal) {
				maxItem = tag;
				maxVal = object[tag];
			}; 
		};
		return maxItem;
	};

	var getTopThings = function(object) {
		$scope.topFive = [];
		while ($scope.topFive.length < 5) {
			var maxItem = findMax(object);
			$scope.topFive.push(maxItem);
			delete object[maxItem];
		};

		$scope.userStats.push({title: 'Top Image Contents', value: $scope.topFive});
	};

	var getImageContents = function() {
		$scope.imageContents = {};
		for (var i = 0; i < $scope.picArray.length - 1; i++) {
			$http({
			    method: "GET",
			    url: CLARIFAI_API_BASE_URL,
			    params: {
			    	'access_token': CLARIFAI_API_TOKEN,
			    	'url': $scope.picArray[i].images.standard_resolution.url
			    }
			}).then(function(response) {
				var tags = response.data.results[0].result.tag.classes;
				for (var j=0; j < tags.length; j++) {
					if (tags[j] in $scope.imageContents) {
						$scope.imageContents[tags[j]] += 1;
					} else {
						$scope.imageContents[tags[j]] = 1;
					};
				};
			});
		};

		//On last iteration, call the topFive func
		$http({
		    method: "GET",
		    url: CLARIFAI_API_BASE_URL,
		    params: {
		    	'access_token': CLARIFAI_API_TOKEN,
		    	'url': $scope.picArray[$scope.picArray.length - 1].images.standard_resolution.url
		    }
		}).then(function(response) {
			var tags = response.data.results[0].result.tag.classes;
			for (var j=0; j < tags.length; j++) {
				if (tags[j] in $scope.imageContents) {
					$scope.imageContents[tags[j]] += 1;
				} else {
					$scope.imageContents[tags[j]] = 1;
				};
			};
			getTopThings($scope.imageContents);
		});
	};
});
