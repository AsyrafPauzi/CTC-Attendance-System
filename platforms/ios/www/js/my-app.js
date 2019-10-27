// Initialize app
var myApp = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var app = new Framework7({});

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {



    console.log(navigator.notification);

    CameraPreview.startCamera({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        camera: CameraPreview.CAMERA_DIRECTION.FRONT,
        toBack: true,
        tapPhoto: true,
        tapFocus: false,
        shutterSound: false,
        previewDrag: false
    }, function() {

    }, function(_error) {

    });

    console.log("Device is ready!");
    if (localStorage.getItem('user_id') != null) {
        myApp.closeModal('.login-screen');
        mainView.loadPage("scan.html");
    }

    if (localStorage.getItem("user_email") === null) {
        $$("#emaillogin").val("");
    } else {
        var user_email = localStorage.getItem('user_email');
        $$("#emaillogin").val(user_email);

    }

});


$$('.form-to-json').on('click', function() {
    var formData = myApp.formToJSON('#my-login');
    $$.ajax({
        type: 'POST',
        url: 'http://ctc-demo.herokuapp.com/api/v1/authentication/staff',
        dataType: 'json',
        data: formData,
        success: function(call) {
            localStorage.setItem('user_id', call.data["id"]);
            localStorage.setItem('firstname', call.data["firstname"]);
            localStorage.setItem('lastname', call.data["lastname"]);
            localStorage.setItem('user_email', call.data["email"]);
            localStorage.setItem('offsite', call.data["isoffsite"]);
            localStorage.setItem('today_clockin', call["today_clockin"]);
            console.log(call)

            function successlogin() {
                myApp.closeModal('.login-screen');
                mainView.loadPage("scan.html");
            }


            navigator.notification.alert(
                'Welcome, ' + call.data["firstname"] + ' ' + call.data["lastname"], // message
                successlogin, // callback
                'Success Login', // title
                'Close' // buttonName
            );



        },
        error: function(data) {
            console.log(data)

            function errorlogin() {
                mainView.loadPage("index.html");
            }


            navigator.notification.alert(
                'wrong password or email please try again', // message
                errorlogin, // callback
                'Error Login', // title
                'Close' // buttonName
            );
        }
    });
    return false;
})

myApp.onPageInit('index', function(page) {




    if ("user" in localStorage) {} else {
        myApp.loginScreen('.login-screen');
    }

})

myApp.onPageInit('scan', function(page) {


    var user_id = localStorage.getItem('user_id');

    $$.ajax({

        type: 'GET',
        url: 'https://ctc-demo.herokuapp.com/api/v1/users/' + user_id + '',
        dataType: 'json',
        headers: {
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'application/json',
        },
        success: function(data) {

            var listholder = document.getElementById("list_data");
            $$.each(data.staff_attendances, function(i, item) {

                var formattedDate = new Date(item.created_at);
                var h = formattedDate.getHours();
                var m = formattedDate.getMinutes();
                var s = formattedDate.getSeconds();
                var day = formattedDate.getDate();
                var month = formattedDate.getMonth() + 1;
                var year = formattedDate.getFullYear();

                var time = (h + ":" + m + ":" + s);
                var date = (day + "/" + month + "/" + year);
                var no = i + 1

                listholder.innerHTML +=
                    '<tr><td align="center">' + no + '</td><td align="center">' + item.location + '</td><td align="center">' + time + '</td>' +
                    '<td align="center">' + date + '</td>' + '<td align="center">' + item.status + '</td></tr>';
            });
        },
        error: function(data) {

            console.log(data);
        }

    });


    checkifoffsite()


    function checkifoffsite() {
        var offsite = localStorage.getItem('offsite');
        if (offsite == "null") {
            $$(".check").hide();
        } else if (offsite == "false") {
            $$(".check").hide();
        } else if (offsite == "true") {
            $$(".checkqr").hide();
            $$(".check").show();
        }

    }

    $$('#prepare').on('click', function() {

        cordova.plugins.barcodeScanner.scan(
            function(result) {
                if (!result.cancelled) {
                    if (result.format == "QR_CODE") {

                        var value = result.text;
                        var url = value;
                        var parts = url.split("/");
                        var last_part = parts[parts.length - 2];
                        console.log(last_part);
                        localStorage.setItem("LocalData", last_part);

                        $$.ajax({

                            type: 'GET',
                            url: 'https://ctc-demo.herokuapp.com/api/v1/clockin/qrcode/' + last_part + '',
                            dataType: 'json',
                            headers: {
                                'Access-Control-Allow-Credentials': true,
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'GET',
                                'Access-Control-Allow-Headers': 'application/json',
                            },
                            success: function(data) {

                                localStorage.setItem("qrcode_id", data.data.id);
                                mainView.loadPage("choose.html");

                            },
                            error: function(data) {


                            }

                        });


                    }
                }
                return false;
            },
            function(error) {

                function errorscan() {
                    mainView.loadPage("scan.html");
                }


                navigator.notification.alert(
                    'Scanning failed, please try again', // message
                    errorscan, // callback
                    'Error Scan', // title
                    'Close' // buttonName
                );

            }
        );
        return false;
    });



})

myApp.onPageInit('choose', function(page) {

    var offsite = localStorage.getItem('offsite');
    var today_clockin = localStorage.getItem('today_clockin');

        if (today_clockin == "true") {
            $$(".clockin").hide();
        } else if (today_clockin == "false") {
            $$(".clockout").hide();
        }

})

myApp.onPageInit('clockin', function(page) {

            var firstname = localStorage.getItem('firstname');

            $$("#name").html(firstname);


            window.plugins.mocklocationchecker.check(successCallback, errorCallback);


            function successCallback(result) {
                console.log(result); // true - enabled, false - disabled
                
                if (result[0].info == "mock-false") {

                    $$('#capturein').on('click', function() {

                        $$(this).attr("disabled", true);


                        var options = {
                            enableHighAccuracy: true,
                            timeout: 5000
                        };

                        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

                        function onSuccess(position) {

                            localStorage.setItem('coordinate', position.coords.latitude + "," + position.coords.longitude);

                            $$.getJSON('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + position.coords.latitude + ',' + position.coords.longitude + '&key=AIzaSyAVGxdFJeNFSJNIA-G0gMO_j44x8yz5MHQ', function(datas) {

                                CameraPreview.takePicture(function(base64PictureData) {

                                    var smallImage = document.getElementById('smallImagein');

                                    smallImage.style.display = 'none';

                                    smallImage.src = "data:image/jpeg;base64," + base64PictureData;

                                    var user_id = localStorage.getItem('user_id');

                                    var offsite = localStorage.getItem('offsite');
                                    if (offsite == "true") {
                                        var qrcode_id = null;
                                    } else {
                                        var qrcode_id = localStorage.getItem('qrcode_id');
                                    }

                                    $$.ajax({
                                        type: 'POST',
                                        url: 'https://ctc-demo.herokuapp.com/api/v1/clockin/staff',
                                        dataType: 'json',
                                        data: {
                                            staff_id: user_id,
                                            qrcode_id: qrcode_id,
                                            user_location: datas.results[0].formatted_address,
                                            base64string: smallImage.src
                                        },
                                        success: function(call, status) {

                                            function successclockin() {

                                                localStorage.removeItem("user_id");
                                                localStorage.removeItem("firstname");
                                                localStorage.removeItem("lastname");
                                                localStorage.removeItem("offsite");
                                                localStorage.removeItem("today_clockin");
                                                localStorage.removeItem("LocalData");
                                                localStorage.removeItem("coordinate");
                                                if ("user" in localStorage) {} else {
                                                    setTimeout(function() {
                                                        mainView.loadPage("index.html");
                                                    }, 3000);

                                                }

                                            }


                                            navigator.notification.alert(
                                                'Succesfull Clockin, Will Redirect To Login Page In 3 Second', // message
                                                successclockin, // callback
                                                'Success Clockin', // title
                                                'Close' // buttonName
                                            );





                                        },
                                        error: function(call, status) {

                                            function errorclockin() {

                                                localStorage.removeItem("user_id");
                                                localStorage.removeItem("firstname");
                                                localStorage.removeItem("lastname");
                                                localStorage.removeItem("offsite");
                                                localStorage.removeItem("today_clockin");
                                                localStorage.removeItem("LocalData");
                                                localStorage.removeItem("coordinate");
                                                if ("user" in localStorage) {} else {
                                                    setTimeout(function() {
                                                        mainView.loadPage("index.html");
                                                    }, 3000);

                                                }

                                            }


                                            navigator.notification.alert(
                                                'You already clockin today, Will Redirect To Login Page In 3 Second', // message
                                                errorclockin, // callback
                                                'Error', // title
                                                'Close' // buttonName
                                            );

                                        }
                                    });

                                });
                            });

                        }

                        function onError(error) {

                            function errorgps() {



                            }


                            navigator.notification.alert(
                                'Please Turn On Your GPS/Location', // message
                                errorgps, // callback
                                'Error Clockin', // title
                                'Close' // buttonName
                            );

                        }
                    });
                } else {
                    x = "Mock location detected";
                document.getElementById("demo").innerHTML = x;
                    $$('#capturein').on('click', function() {

                            $$(this).attr("disabled", true);

                            function mocklocation() {



                            }


                            navigator.notification.alert(
                                'Close your fake GPS and try again', // message
                                mocklocation, // callback
                                'Mock Location Detected', // title
                                'Close' // buttonName
                            );
                        });
                    }
                }

                function errorCallback(error) {
                    console.log(error);
                    alert(JSON.stringify(error));
                }



                startTime();

                function startTime() {
                    const now = new Date();
                    var h = now.getHours();
                    var m = now.getMinutes();
                    var s = now.getSeconds();
                    var day = now.getDate();
                    var month = now.getMonth() + 1;
                    var year = now.getFullYear();
                    m = checkTime(m);
                    s = checkTime(s);
                    $$("#datein").html(day + " / " + month + " / " + year);
                    $$("#timein").html(h + ":" + m + ":" + s);
                    var t = setTimeout(startTime, 500);

                }



                function checkTime(i) {
                    if (i < 10) {
                        i = "0" + i
                    }; // add zero in front of numbers < 10
                    return i;
                }


            })

        myApp.onPageInit('clockout', function(page) {

            var firstname = localStorage.getItem('firstname');

            $$("#nameout").html(firstname);

            $$('#captureout').on('click', function() {

                var user_id = localStorage.getItem('user_id');

                var timeout = localStorage.getItem('timeout');

                $$.ajax({
                    type: 'POST',
                    url: 'https://ctc-demo.herokuapp.com/api/v1/clockout/staff',
                    dataType: 'json',
                    data: {
                        staff_id: user_id,
                        time: timeout,
                    },
                    success: function(call, status) {

                        function successclockout() {

                            localStorage.removeItem("user_id");
                            localStorage.removeItem("firstname");
                            localStorage.removeItem("lastname");
                            localStorage.removeItem("offsite");
                            localStorage.removeItem("today_clockin");
                            localStorage.removeItem("LocalData");
                            localStorage.removeItem("coordinate");
                            if ("user" in localStorage) {} else {
                                setTimeout(function() {
                                    mainView.loadPage("index.html");
                                }, 3000);

                            }

                        }


                        navigator.notification.alert(
                            'Succesfull Clockout, Will Redirect To Login Page In 3 Second', // message
                            successclockout, // callback
                            'Success Clockout', // title
                            'Close' // buttonName
                        );

                    },
                    error: function(call, status) {

                        function errorclockout() {

                            localStorage.removeItem("user_id");
                            localStorage.removeItem("firstname");
                            localStorage.removeItem("lastname");
                            localStorage.removeItem("offsite");
                            localStorage.removeItem("today_clockin");
                            localStorage.removeItem("LocalData");
                            localStorage.removeItem("coordinate");
                            if ("user" in localStorage) {} else {
                                setTimeout(function() {
                                    mainView.loadPage("index.html");
                                }, 3000);

                            }

                        }


                        navigator.notification.alert(
                            'You already Clockout today, Will Redirect To Login Page In 3 Second', // message
                            errorclockout, // callback
                            'Error Clockout', // title
                            'Close' // buttonName
                        );
                    }
                });
            });

            startTime();

            function startTime() {
                const now = new Date();
                var h = now.getHours();
                var m = now.getMinutes();
                var s = now.getSeconds();
                var day = now.getDate();
                var month = now.getMonth() + 1;
                var year = now.getFullYear();
                m = checkTime(m);
                s = checkTime(s);
                $$("#dateout").html(day + " / " + month + " / " + year);
                $$("#timeout").html(h + ":" + m + ":" + s);
                localStorage.setItem("timeout", h + ":" + m + ":" + s);


                var t = setTimeout(startTime, 500);

            }



            function checkTime(i) {
                if (i < 10) {
                    i = "0" + i
                }; // add zero in front of numbers < 10
                return i;
            }


        })