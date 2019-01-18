// Initialize Firebase
var config = {
    apiKey: "AIzaSyCyTlLrY30Yw_3eqKWmj4ejqmAAYL_X1-Y",
    authDomain: "flu-fighters.firebaseapp.com",
    databaseURL: "https://flu-fighters.firebaseio.com",
    projectId: "flu-fighters",
    storageBucket: "flu-fighters.appspot.com",
    messagingSenderId: "356867364502"
};
firebase.initializeApp(config);

var auth = firebase.auth();

var storage = firebase.storage();

var database = firebase.database();

$("#loginBtn").on("click", function () {
    var email = $("#emailInput").val().trim();
    var password = $("#passwordInput").val().trim();
    var promise = auth.SignInWithEmailAndPassword(email, password).catch(function (error) {
        console.log(error.code + ": " + error.message);
    })
});

$("#signUpBtn").on("click", function () {
    var email = $("#emailInput").val().trim();
    var password = $("#passwordInput").val().trim();
});

function GameObject(name, images, details) {
    this.name = name;
    this.images = images;
    this. details = details;
}

var park1 = new GameObject("test park one", 5, {
    pic1: "pick1 url",
    pick1Hint: "pick1 hint",
    pic2: "pick1 url",
    pick2Hint: "pick1 hint",
    pic3: "pick1 url",
    pick3Hint: "pick1 hint",
    pic4: "pick1 url",
    pick4Hint: "pick1 hint",
    pic5: "pick1 url",
    pick5Hint: "pick1 hint",
    
})


