const gradients = ["Purple Bliss","Mantle","Witching Hour","Nighthawk","Amethyst","Sylvia","Kashmir","Aubergine","Mello","Dark Ocean","Deep Sea Space","Kye Meh","SoundCloud","Tranquil"];
var colorUrl = "https://uigradients.com/gradients.json";
var colorArray = [];
$.ajax({
    method: "GET",
    url: colorUrl,
    }).then(function(response) {
        response.forEach(function(color) {
            if (gradients.indexOf(color.name) > -1) {
                colorArray.push(color);
            };
        });
    });

var config = {
    apiKey: "AIzaSyCyTlLrY30Yw_3eqKWmj4ejqmAAYL_X1-Y",
    authDomain: "flu-fighters.firebaseapp.com",
    databaseURL: "https://flu-fighters.firebaseio.com",
    projectId: "flu-fighters",
    storageBucket: "flu-fighters.appspot.com",
    messagingSenderId: "356867364502"
};
firebase.initializeApp(config);


// ------------ Authentication Area -----------------//

var authentication = {
    justSigned: false,
    displayName: null,
    // Need to set this from the form login page. update on html script for now
    signUp: function (e) {
        e.preventDefault();
        authentication.justSigned = true;

        authentication.displayName = $("#displayName").val().trim();
        var email = $("#email").val().trim();
        var password = $("#password").val().trim();

        var promise = firebase.auth().createUserWithEmailAndPassword(email, password)

        promise.catch(function (error) {
            console.log(error.code + ": " + error.message);
        });
    },

    login: function (e) {
        e.preventDefault();

        var email = $("#email").val().trim();
        var password = $("#password").val().trim();

        var promise = firebase.auth().signInWithEmailAndPassword(email, password);

        promise.catch(function (error) {
            console.log(error.code + ": " + error.message);
        })
    },

    moveToRooms: function () {
        $("#main-content").slideUp();
        $("#room-container").slideDown();
    },




    hello: firebase.auth().onAuthStateChanged(function (user) {
        if (user && authentication.justSigned) {
            // User is signed in and just created account
            user.updateProfile({
                displayName: authentication.displayName,
            });
            console.log("ran justSigned");
            authentication.justSigned = false;
            authentication.moveToRooms();
            console.log(user + " first sign in");
        } else if (user && !authentication.justSigned) {
            // User is signed in and already was a user
            console.log(user);
            console.log(user.displayName + " logged in again");
            authentication.displayName = user.displayName;
            authentication.moveToRooms();
        } else {
            console.log("not logged in");
            // Not signed in
            $("#main-content").slideDown();
        }
    }),

    goodbye: firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(function () {
            var provider = new firebase.auth.GoogleAuthProvider();
            // In memory persistence will be applied to the signed in Google user
            // even though the persistence was set to 'none' and a page redirect
            // occurred.
            return firebase.auth().signInWithRedirect(provider);
        })
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
        }),

}


// ---------------- Image Recognition Api ----------//

const app = new Clarifai.App({
    apiKey: 'ead5e62eaa3444cf8d7881fcd75751c5'
});

// Will tell you what is in the image
// Not using but still pretty cool
function predictURL(url) {
    app.models.initModel({ id: Clarifai.GENERAL_MODEL, version: "aa7f35c01e0642fda5cf400f543e7c40" })
        .then(generalModel => {
            return generalModel.predict(url);
        })
        .then(response => {
            var concepts = response['outputs'][0]['data']['concepts'];
            console.log(concepts);
            var highLevel = concepts.filter(function (concept) {
                return concept.value >= .94;
            });
            console.log(highLevel);
            return concepts;
        })
}

// ------------------------ Game Object -----------------------//

var game = {

    correctPics: [],
    userPics: [],

    // Load game pictures from our created databse
    // Can load from user gen database later
    getURL: function () {
        var getThem = firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey)
            .once("value", function (snap) {
                console.log(snap.val());
                game.correctPics = [snap.val().pic1CorrectURL, snap.val().pic2CorrectURL, snap.val().pic3CorrectURL, snap.val().pic4CorrectURL, snap.val().pic5CorrectURL];
                game.userPics = [snap.val().pic1URL, snap.val().pic2URL, snap.val().pic3URL, snap.val().pic4URL, snap.val().pic5URL,]
            }).then(function (response) {
                console.log("finished");
                console.log(response);
                setTimeout(game.runCompare, 3000);
            });
    },

    // Loads the 5 urls from correctPics to clarifai cloud
    // Not in use due to clarifai only storing the same url once
    // Will user when making the games
    addToClarifai: function () {

        if (game.correctPics.length === 5) {
            app.inputs.create([
                // pretty certain can run for loop with right keys
                // may want to ad id's to the mix or metadata
                { url: game.correctPics[0], id: userRoom.roomKey + "pic1" },
                { url: game.correctPics[1], id: userRoom.roomKey + "pic2" },
                { url: game.correctPics[2], id: userRoom.roomKey + "pic3" },
                { url: game.correctPics[3], id: userRoom.roomKey + "pic4" },
                { url: game.correctPics[4], id: userRoom.roomKey + "pic5" },
            ]).then(
                function (response) {
                    // do something with response
                    console.log(response);
                    setTimeout(game.runCompare, 3000);
                },
                function (err) {
                    // there was an error
                    console.log(err);
                }
            );
        }
    },

    checkClarifaiStorage: function () {
        // Just checks what is in the clarifai database
        app.inputs.list().then(
            function (response) {
                // do something with response
                console.log(response)
            },
            function (err) {
                // there was an error
                console.log(err);
            }
        );
    },

    deleteClarifai: function () {
        // Dumps entire database
        // Can pinpoint to certain id's in future
        app.inputs.delete().then(
            function (response) {
                // do something with response
                console.log(response)
            },
            function (err) {
                // there was an error
                console.log(err);
            }
        );
    },

    checkURL: function (URL, i) {
        // Basic component of the game, get the values back
        app.inputs.search({ input: { url: URL } }).then(
            function (response) {

                // What this is going to do is grab the user pic and correct pic and send them to the html
                // Run the comparison of the url for user pic against all pics in clarifai database
                // Find the score of the url of the correct pic for that input
                // Post that score to the html

                // You can maybe add them up for an overall score or something
                // Will be in form of 89 meaning 89% similairty between pics

                // The Html endpoints are the same names with 0, 1, 2, 3, or 4 seperating them from eachother
                // uses iterator from the runCompare() for loop as the number for each check
                // This is because they come back in different order than put in


                console.log("-------------------------------------------")
                console.log(response);
                console.log("This was the url used " + URL);
                console.log(i + " was the iterator from run compare");
                $("#item" + i).find(".imgGuess").attr("src", game.userPics[i]);
                $("#item" + i).find(".imgRight").attr("src", game.correctPics[i])
                var rightPic = game.correctPics[i];
                console.log(game.correctPics[i]);
                console.log(game.userPics[i]);
                var getRight = [];
                for (var j = 0; j < response.hits.length; j++) {
                    getRight.push(response.hits[j].input.data.image.url);
                }
                console.log(getRight.indexOf(rightPic) + " is the index of the rightpic in the hits array");
                var rightPicIndex = getRight.indexOf(rightPic);
                var score = response.hits[rightPicIndex].score
                score = (score.toFixed(2)) * 100

                var num = 0;
                var target = $("#item" + i);
                target.attr("data-score",score);
                // var stars = target.find(".stars");
                // var percentage = target.find(".percentage");
                // var starAnim = setInterval(function() {
                //     var rect = 20+(num*0.85) + "px";
                //     stars.css("clip","rect(0, " + rect + ", 125px, 0)");
                //     percentage.text(Math.floor(num)+"%");
                //     percentage.css("color",getColor(num/100));
                //     if (num >= score) {
                //         clearInterval(starAnim);
                //     }
                //     num += 0.25;
                // },5);

                //It takes the score and it loops num until it reaches the score.
                // $("#item" + i).find(".percentage").text(score);
                console.log("--------------------------------------------")
            },
            function (err) {
                // there was an error
                console.log(err);
            }
        );
    },

    runCompare: function () {
        // When this gets through the response, will delete all of the userRoom information
        // Can keep this way or can move to the event when result page closed
        var update = {
            closed: true,
        };
        var saveClose = firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey);
        saveClose.update(update);

        for (var i = 0; i < game.userPics.length; i++) {
            game.checkURL(game.userPics[i], i);
        }
        // $(".gameRoom").fadeOut();
        $("#gameRoom").css("display","none");
        setTimeout(function () {

            firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey).off();
            firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey).remove();
            console.log(userRoom.roomKey);
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic1URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic2URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic3URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic4URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic5URL").delete();
            $("#results-screen").show();
        }, 5000);
    },


}; //End of Game Object

// ---------------File Input ---------------//

var fileInputArea = document.getElementById("gameRoom");

fileInputArea.addEventListener("change", function (e) {
    if (e.target.type === "file") {
        doSomethingWithFiles(e);
    }
})

function doSomethingWithFiles(e) {
    // Grabs the files from the input, stores it in storage array
    // When storageArray.length == 5, takes the files and stores them to the firebase cloud
    console.log(e.target.files);
    // console.log(e.target.files);

    var file = e.target.files[0];
    var whichInput = e.target.id;
    var whichURL = $("#" + whichInput).attr("data-pic");
    switch (whichURL) {
        case "pic1URL":
            picHolder[0].picFile = file;
            picHolder[0].picChange = true;
            updateStorage();
            break;
        case "pic2URL":
            picHolder[1].picFile = file;
            picHolder[1].picChange = true;
            updateStorage();
            break;
        case "pic3URL":
            picHolder[2].picFile = file;
            picHolder[2].picChange = true;
            updateStorage();
            break;
        case "pic4URL":
            picHolder[3].picFile = file;
            picHolder[3].picChange = true;
            updateStorage();
            break;
        case "pic5URL":
            picHolder[4].picFile = file;
            picHolder[4].picChange = true;
            updateStorage();
            break;
        default:
            console.log("pic switch not working as expected");
    }
    console.log(picHolder);

}

var picHolder = [
    { picName: "pic1URL", picChange: false, picFile: null },
    { picName: "pic2URL", picChange: false, picFile: null },
    { picName: "pic3URL", picChange: false, picFile: null },
    { picName: "pic4URL", picChange: false, picFile: null },
    { picName: "pic5URL", picChange: false, picFile: null }
];

var whichPic = null;
var picSub = null;


function updateStorage() {
    for (var i = 0; i < picHolder.length; i++) {
        console.log(picHolder[i].picChange);
        if (picHolder[i].picChange === true) {
            picHolder[i].picChange = false;
            picSub = picHolder[i].picName;
            var place = firebase.storage().ref("/userPics/" + userRoom.roomKey + "/" + picHolder[i].picName);
            var setPic = place.put(picHolder[i].picFile).then(function (snap) {
                console.log("added pic");
                snap.ref.getDownloadURL().then(function (url) {
                    whichPic = url;
                })

            });
            console.log(picHolder[i].picName);
        }
    }
    updateDatabase();

}

function updateDatabase() {
    if (whichPic == null || picSub == null) {
        console.log("waiting to update database");
        setTimeout(updateDatabase, 250);
    } else {
        console.log("whichPic: " + whichPic + ", picName:" + picSub);
        var userDatabase = firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey);

        switch (picSub) {
            case "pic1URL":
                var update = {
                    pic1URL: whichPic,
                }
                userDatabase.update(update);
                break;
            case "pic2URL":
                var update = {
                    pic2URL: whichPic,
                }
                userDatabase.update(update);
                break;
            case "pic3URL":
                var update = {
                    pic3URL: whichPic,
                }
                userDatabase.update(update);
                break;
            case "pic4URL":
                var update = {
                    pic4URL: whichPic,
                }
                userDatabase.update(update);
                break;
            case "pic5URL":
                var update = {
                    pic5URL: whichPic,
                }
                userDatabase.update(update);
                break;
            default:
                console.log("pickSub switch not working as expected");
        };
        whichPic = null;
        picSub = null;
    }
}

function setUpRelay() {
    var real = firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey).on("value", function (snapshot) {
        console.log("loading picture urls")
        if (snapshot.val().closed === false) {
            // this will change when the files are sumbitted to runCompare();
            $("#img1").attr("src", snapshot.val().pic1URL);
            $("#img2").attr("src", snapshot.val().pic2URL);
            $("#img3").attr("src", snapshot.val().pic3URL);
            $("#img4").attr("src", snapshot.val().pic4URL);
            $("#img5").attr("src", snapshot.val().pic5URL);
        } else {
            // Kicks people out of the room
            // This is where the page loads different parts of the html
            $(".gameRoom").hide();
            $("#room-container").hide();
        }

    })
}

// Room Object-------------------------//

var userRoom = {

    roomName: "Mikes",//Grab from html input
    gameName: "testGame1",//grab from html input
    hints: [],
    picURLs: [],
    picRightURLs: [],
    roomKey: "",

    getHints: function () {
        console.log("Get the fuck outta here");
        var database = firebase.database().ref("/gameStorage/games/" + this.gameName);

        database.once("value", function (snapshot) {
            console.log(snapshot.val());
            for (var i = 0; i < snapshot.val().length; i++) {
                userRoom.hints.push(snapshot.val()[i].picHint);
                userRoom.picURLs.push(snapshot.val()[i].picURL);
                userRoom.picRightURLs.push(snapshot.val()[i].picRight);
                console.log(userRoom.hints[i]);
            }
        }).then(function (response) {
            userRoom.roomDatabaseInit();
        });
    },

    roomDatabaseInit: function () {
        var roomDatabase = firebase.database().ref("/gameStorage/userRooms/")
        var roomNew = roomDatabase.push();

        roomNew.set({
            hint1: this.hints[0],
            hint2: this.hints[1],
            hint3: this.hints[2],
            hint4: this.hints[3],
            hint5: this.hints[4],

            roomName: userRoom.roomName,
            roomKey: "",
            roomCreator: authentication.displayName,
            closed: false,

            users: [authentication.displayName],
            // Will be grabbed from auth process

            pic1URL: this.picURLs[0],
            pic2URL: this.picURLs[1],
            pic3URL: this.picURLs[2],
            pic4URL: this.picURLs[3],
            pic5URL: this.picURLs[4],
            pic1CorrectURL: this.picRightURLs[0],
            pic2CorrectURL: this.picRightURLs[1],
            pic3CorrectURL: this.picRightURLs[2],
            pic4CorrectURL: this.picRightURLs[3],
            pic5CorrectURL: this.picRightURLs[4],
        }).then(function (response) {
            var holdKeys = [];
            firebase.database().ref("/gameStorage/userRooms").orderByKey().on("child_added", function (snapshot) {
                holdKeys.push(snapshot.key);
            });
            var newKey = holdKeys[holdKeys.length - 1];
            userRoom.roomKey = newKey;
            var update = {
                roomKey: newKey,
            }
            var saveKey = firebase.database().ref("/gameStorage/userRooms/" + newKey);
            saveKey.update(update);
        });

    },

    sendRoomstoPage: firebase.database().ref("/gameStorage/userRooms").on("value", function (snap) {
        $("#room-screen").html("");
        snap.forEach(function (childSnap) {

            var childKey = childSnap.key;
            var childData = childSnap.val();
            var newDiv = $("<div>").attr("class", "box room").attr("data-roomKey", childKey);
            var title = $("<h2>").attr("class", "divTitle").text(childData.roomName.toUpperCase());

            const randomGrad = colorArray[Math.floor(Math.random()*10)]
            let gradString = "to bottom right, " //`${Math.floor(Math.random()*360)}deg, `
            for (let num = 0; num < randomGrad.colors.length; num++) {
                gradString += randomGrad.colors[num];
                if (num < randomGrad.colors.length-1) {
                    gradString += ",";
                };
            };
            newDiv.css("background-image",`linear-gradient(${gradString})`);
            // var userNum = $("<h2>").attr("class", "userNum").text(childData.users.length);
            // Not keeping track of users 
            // newDiv.append(title, userNum);
            newDiv.append(title);
            $("#room-screen").prepend(newDiv);
        })
    }),

    openRoom: function () {
        $("#room-container").slideUp();
        var gameDatabase = firebase.database().ref("/gameStorage/userRooms/" + $(this).attr("data-roomKey"));
        userRoom.roomKey = $(this).attr("data-roomKey");

        gameDatabase.on("value", function (snap) {
            var here = snap.val();
            $("#title").text(here.roomName);
            $("#hint1").text(here.hint1);
            $("#hint2").text(here.hint2);
            $("#hint3").text(here.hint3);
            $("#hint4").text(here.hint4);
            $("#hint5").text(here.hint5);
        })
        setUpRelay();
        $(".gameRoom").slideDown();
    },

    createRoom: function () {
        var gameDatabase = firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey);
        gameDatabase.once("value", function (snap) {
            var here = snap.val();
            $("title").text(here.roomName);
            $("#hint1").text(here.hint1);
            $("#hint2").text(here.hint2);
            $("#hint3").text(here.hint3);
            $("#hint4").text(here.hint4);
            $("#hint5").text(here.hint5);
        })
        setUpRelay();
    }
}

// $(".signUpSubBtn").on("click", authentication.signUp);
// $(".loginSubBtn").on("click", authentication.login);

$("#login-form").submit(function(e) {
    e.preventDefault();
    if ($("#signUp").hasClass("signingUp")) {
        // Create account submission
        authentication.signUp(e);
    } else {
        // Login submission
        authentication.login(e);
    }
});

$("#room-screen").on("click", ".box", userRoom.openRoom);

$(".subBtn").on("click", game.getURL);


$(".createRoom").on("click", function () {
    $("#room-container").slideUp();
    $(".createRoomArea").slideDown();
})

$(".selectRoom").on("click", function () {
    userRoom.gameName = $(this).attr("data-game");
    userRoom.roomName = $("#roomName").val().trim();
    userRoom.getHints();
    setTimeout(function () {
        userRoom.createRoom();
        $(".createRoomArea").slideUp();
        $(".gameRoom").slideDown();
    }, 3000);
})










// Only for loading our games to the databases
// Need to manually load pics to firebase storage to get urls

function setTestGame() {
    var database = firebase.database().ref("/gameStorage/games/testGame2");
    // set to game name


    database.set([
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "HardWired",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200617772.jpg?alt=media&token=0db2a77f-5ae0-40ae-9d49-ec655d128277"
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "GOTG",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200630286.jpg?alt=media&token=d1f911f6-322d-4e7a-b4d8-e2a247be9fff"
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "BluesBros",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200641315.jpg?alt=media&token=b579e601-94ca-4e93-b4d0-ed72c993da76",
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "NR&TNS",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200705502.jpg?alt=media&token=13ebccaf-6a56-4975-a027-7d3e9387366f"
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "CCR",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200720504.jpg?alt=media&token=651337b4-af22-4771-b7bf-8b7a32322c69"
        }

    ]);

    app.inputs.create([
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200617772.jpg?alt=media&token=0db2a77f-5ae0-40ae-9d49-ec655d128277" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200630286.jpg?alt=media&token=d1f911f6-322d-4e7a-b4d8-e2a247be9fff" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200641315.jpg?alt=media&token=b579e601-94ca-4e93-b4d0-ed72c993da76" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200705502.jpg?alt=media&token=13ebccaf-6a56-4975-a027-7d3e9387366f" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame2%2FIMG_20190125_200720504.jpg?alt=media&token=651337b4-af22-4771-b7bf-8b7a32322c69" },
    ]).then(
        function (response) {
            // do something with response
            console.log(response);
            console.log("loading was successful");
        },
        function (err) {
            // there was an error
            console.log(err);
        }
    );


}
