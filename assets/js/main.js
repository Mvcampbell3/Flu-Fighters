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

        authentication.displayName = $("#nameInputSign").val().trim();
        var email = $("#emailInputSign").val().trim();
        var password = $("#passwordInputSign").val().trim();

        var promise = firebase.auth().createUserWithEmailAndPassword(email, password)

        promise.catch(function (error) {
            console.log(error.code + ": " + error.message);
        });
    },

    login: function (e) {
        e.preventDefault();

        var email = $("#emailInputLog").val().trim();
        var password = $("#passwordInputLog").val().trim();

        var promise = firebase.auth().signInWithEmailAndPassword(email, password);

        promise.catch(function (error) {
            console.log(error.code + ": " + error.message);
        })
    },

    moveToRooms: function () {
        $(".loginArea").slideUp();
        $(".roomArea").slideDown();
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
        }
    }),

    goodbye: firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
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

    // Only dumps file that have that id, may modify into array
    deleteClarifaiExact: function () {
        var id_1 = userRoom.roomKey + ("pic1");
        var id_2 = userRoom.roomKey + ("pic2");
        var id_3 = userRoom.roomKey + ("pic3");
        var id_4 = userRoom.roomKey + ("pic4");
        var id_5 = userRoom.roomKey + ("pic5");

        app.inputs.delete([{ id_1 }, { id_2 }, { id_3 }, { id_4 }, { id_5 }]).then(
            function (response) {
                console.log(response);
            },
            function (err) {
                console.log(err);
            }
        );
    },

    checkURL: function (URL) {
        // Basic component of the game, get the values back
        // can also be targeted if cloud storage is too big
        app.inputs.search({ input: { url: URL } }).then(
            function (response) {
                // do something with response
                // response will contain the values of the url vs urls in clarifai cloud
                console.log(response);
                // This is where we will do somthing with the response in terms of right or wrong
                // Send it to the correct place on the HTML
                // Will add component to check if url is in the game url list
            },
            function (err) {
                // there was an error
                console.log(err);
            }
        );
    },

    runCompare: function () {
        var update = {
            closed: true,
        };
        var saveClose = firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey);
        saveClose.update(update);

        for (var i = 0; i < game.userPics.length; i++) {
            game.checkURL(game.userPics[i]);
        }
        $(".gameRoom").fadeOut();
        setTimeout(function () {

            firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey).off();
            firebase.database().ref("/gameStorage/userRooms/" + userRoom.roomKey).remove();
            console.log(userRoom.roomKey);
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic1URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic2URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic3URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic4URL").delete();
            firebase.storage().ref('userPics/' + userRoom.roomKey + "/pic5URL").delete();
            $(".roomArea").show();
        }, 5000);
    },


}; //End of Game Object

// ---------------File Input ---------------//

// Need to clean this up, add to the game object or make new object


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
            $("#img1").attr("src", snapshot.val().pic1URL);
            $("#img2").attr("src", snapshot.val().pic2URL);
            $("#img3").attr("src", snapshot.val().pic3URL);
            $("#img4").attr("src", snapshot.val().pic4URL);
            $("#img5").attr("src", snapshot.val().pic5URL);
        } else {
            $(".gameRoom").hide();
            $(".roomArea").show();
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
        // Need to push room to userRooms database
        // Save Room ID;
        // Data-room 
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
        $(".outputArea").html("");
        snap.forEach(function (childSnap) {
            var childKey = childSnap.key;
            var childData = childSnap.val();
            var newDiv = $("<div>").attr("class", "box").attr("data-roomKey", childKey);
            var title = $("<h2>").attr("class", "divTitle").text(childData.roomName);
            var userNum = $("<h2>").attr("class", "userNum").text(childData.users.length);

            newDiv.append(title, userNum);
            $(".outputArea").prepend(newDiv);
        })
    }),

    openRoom: function () {
        $(".roomArea").slideUp();
        var gameDatabase = firebase.database().ref("/gameStorage/userRooms/" + $(this).attr("data-roomKey"));
        userRoom.roomKey = $(this).attr("data-roomKey");

        gameDatabase.on("value", function (snap) {
            var here = snap.val();
            $(".roomTitle").text(here.roomName);
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
            $(".roomTitle").text(here.roomName);
            $("#hint1").text(here.hint1);
            $("#hint2").text(here.hint2);
            $("#hint3").text(here.hint3);
            $("#hint4").text(here.hint4);
            $("#hint5").text(here.hint5);
        })
        setUpRelay();
    }
}

$(".signUpSubBtn").on("click", authentication.signUp);
$(".loginSubBtn").on("click", authentication.login);

$(".outputArea").on("click", ".box", userRoom.openRoom);

$(".subBtn").on("click", game.getURL);


$(".createRoom").on("click", function () {
    $(".roomArea").slideUp();
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

function setTestGame() {
    var database = firebase.database().ref("/gameStorage/games/testGame1");
    // set to game name


    database.set([
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "Birthday Sign",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161536997.jpg?alt=media&token=96cecc86-de0e-4169-bf11-c68d8d39045f"
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "Home Sign",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161547509.jpg?alt=media&token=36d5318a-89d1-4578-821f-06038cc2b5e1"
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "Air Fryer",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161616979.jpg?alt=media&token=f0479709-6b91-4c24-9106-1d36909626f9",
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "Instant Pot",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161630353.jpg?alt=media&token=3c1a5b30-c30d-4ae3-b5dc-5c72555fbf93"
        },
        {
            picURL: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FnotGuessed.jpg?alt=media&token=39e3d7d3-dce7-422b-9de7-a5a9d48a2404",
            picHint: "Lightning Mcqueen",
            picRight: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161641626.jpg?alt=media&token=30e3a751-ac55-4a3e-87aa-02fbd1f3e5d3"
        }

    ]);

    app.inputs.create([
        // pretty certain can run for loop with right keys
        // may want to ad id's to the mix or metadata
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161536997.jpg?alt=media&token=96cecc86-de0e-4169-bf11-c68d8d39045f" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161547509.jpg?alt=media&token=36d5318a-89d1-4578-821f-06038cc2b5e1" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161616979.jpg?alt=media&token=f0479709-6b91-4c24-9106-1d36909626f9" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161630353.jpg?alt=media&token=3c1a5b30-c30d-4ae3-b5dc-5c72555fbf93" },
        { url: "https://firebasestorage.googleapis.com/v0/b/flu-fighters.appspot.com/o/gamePics%2FtestGame%2FIMG_20190120_161641626.jpg?alt=media&token=30e3a751-ac55-4a3e-87aa-02fbd1f3e5d3" },
    ]).then(
        function (response) {
            // do something with response
            console.log(response);
        },
        function (err) {
            // there was an error
            console.log(err);
        }
    );


}
