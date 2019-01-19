var config = {
    apiKey: "AIzaSyCyTlLrY30Yw_3eqKWmj4ejqmAAYL_X1-Y",
    authDomain: "flu-fighters.firebaseapp.com",
    databaseURL: "https://flu-fighters.firebaseio.com",
    projectId: "flu-fighters",
    storageBucket: "flu-fighters.appspot.com",
    messagingSenderId: "356867364502"
};
firebase.initializeApp(config);


async function testApi() {
    deepai.setApiKey("14509c83-dfe2-4033-8c06-7be7611f300c");
    var result = await deepai.callStandardApi("image-similarity", {
        image1: url1,
        image2: url2,
    });
    console.log(result);
}
// This will run the test url through
$(".testBtn").on("click", testApi);

// ------------ Authentication Area -----------------//

var justSigned = false;
var displayName;

var auth = firebase.auth();

$(".signUpSubBtn").on("click", function (e) {
    e.preventDefault();
    // Create user has a password confirmation input
    if ($("#passwordInput1").val().trim() === $("#passwordInput2").val().trim()) {
        justSigned = true;

        displayName = $("#nameInputSign").val().trim();
        var email = $("#emailInputSign").val().trim();
        var password = $("#passwordInputSign").val().trim();

        var promise = auth.createUserWithEmailAndPassword(email, password)

        promise.catch(function (error) {
            console.log(error.code + ": " + error.message);
        })
    } else {
        alert("Passwords do not match");
    }

});

$(".loginSubBtn").on("click", function (e) {
    e.preventDefault();

    var email = $("#emailInputLog").val().trim();
    var password = $("#passwordInputLog").val().trim();

    var promise = auth.signInWithEmailAndPassword(email, password);

    promise.catch(function (error) {
        console.log(error.code + ": " + error.message);
    })
})

auth.onAuthStateChanged(function (user) {
    if (user && justSigned) {
        // User is signed in and just created account
        user.updateProfile({
            displayName: displayName,
        });
        justSigned = false;
        console.log(user + " first sign in");
    } else if (user && !justSigned) {
        // User is signed in and already was a user
        console.log(user);
        console.log(user.displayName + " logged in again");
    } else {
        console.log("not logged in");
        // Not signed in
    }
});

// This is to log someone off when the close the browser
auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
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
    });
;
// ---------------File Input ---------------//

var storageRef = firebase.storage().ref("/comparePics");

var fileInput = document.getElementById('file-input');

fileInput.addEventListener('change', (e) => doSomethingWithFiles(e));


function doSomethingWithFiles(e) {
    console.log(e.target.files);
    console.log(e.target.files[0].name);
    var place = storageRef.child(e.target.files[0].name);
    console.log(place);

    var file = e.target.files[0];
    place.put(file).then(function (snapshot) {
        console.log('Uploaded a blob or file!');
        snapshot.ref.getDownloadURL().then(function (downloadURL) {
            console.log(downloadURL);
        })
    });
}

var url1;
var url2;

function getSavedUrls(name) {
    var getStorage = firebase.storage().ref("/gamePics");

    getStorage.child(name).getDownloadURL().then(function (url) {
        console.log(url);
        url1 = url;
    })
}

function getTestUrls(name) {
    var compareStorage = firebase.storage().ref("/comparePics");

    compareStorage.child(name).getDownloadURL().then(function (url) {
        console.log(url);
        url2 = url;
    })
}