var req = require('request');
var crypto = require('crypto');


/**
 * handles POST requests from app straight after client initiated provider login
 */
exports.post = function(request, response) {
    var appuser = request.service.tables.getTable('appuser');
    var user = request.service.user;
    var mssql = request.service.mssql;
    //console.log(item.access_token);
    var item;
    var url;
    var fbAccessToken = request.body.access_token;
    console.log(fbAccessToken);
    url = 'https://graph.facebook.com/me?access_token=' + fbAccessToken;

    /*NEED TO FIGURE THIS TO ADD NEW PROVIDERS
    //get appropriate provider identity  
    var url;  
    var identities = user.getIdentities();
    if (identities.google) {
        var googleAccessToken = identities.google.accessToken;
        url = 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + googleAccessToken;
    } else if (identities.facebook) {
        var fbAccessToken = identities.facebook.accessToken;
        url = 'https://graph.facebook.com/me?access_token=' + fbAccessToken;
    } else if (identities.microsoft) {
        var liveAccessToken = identities.microsoft.accessToken;
        url = 'https://apis.live.net/v5.0/me/?method=GET&access_token=' + liveAccessToken;
    } else if (identities.twitter) {
    }*/


    if (url) {
        var requestCallback = function(err, resp, body) {
            //send request to provider and parse response (specific to facebook)

            //if doesn't return OK, otherwise parse the userdata returned for username
            if (err || resp.statusCode !== 200) {
                console.error('Error sending data to the provider: ', err);
                request.respond(statusCodes.INTERNAL_SERVER_ERROR, body);
            } else {
                try {
                    //graph API returns JSON object containing user info. parse for appropriate 
                    //fields 
                    var userData = JSON.parse(body);
                    if (userData.name != null) {

                        //get user data
                        item = {
                            firstName: userData.first_name,
                            lastName: userData.last_name,
                            emailAddress: userData.email,
                            Gender_idGender: userData.gender,
                            birthday: userData.birthday
                        };
                        
                        //testing
                        console.log('item ' + item.firstName);
                        console.log('this is what was got from fb ' + item.firstName + " " + item.lastName + " " + item.emailAddress);

                        //handles conversion to appropriate PK (only handles male/female)
                        if (item.Gender_idGender === 'male') {
                            item.Gender_idGender = Number('1');
                            item.Gender_idGender = parseInt(item.Gender_idGender);
                        } else {
                            item.Gender_idGender = Number('2');
                            item.Gender_idGender = parseInt(item.Gender_idGender);
                        }
                        console.log("after parse " + item.Gender_idGender);

                        //check to see if email account already exists
                        appuser.where({ emailAddress: item.emailAddress }).read({
                            success: function(results) {
                                if (results.length > 0) {
                                    //account exists, return OK
                                    response.send(200, results[0]);
                                }
                                else {
                                    //insert new user into app
                                    var params = [item.firstName, item.lastName, item.emailAddress, item.Gender_idGender, item.birthday];
                                    var sql = "INSERT INTO appuser (firstName, lastName, emailAddress, Gender_idGender, birthday) VALUES (?,?,?,?,?);";
                                    mssql.query(sql, params, {
                                        success: function(results) {
                                            if (results.length = 1) {
                                                //create token to return to app user
                                                item.token = zumoJwt('custom', item.emailAddress, request.service.config.masterKey);
                                                console.log("New providerauth user added")
                                                
                                                //add idUser to response
                                                item.idUser = results.idUser;
                                                
                                                //remove sensitive data from response
                                                delete item.password;
                                                delete item.salt;
                                                
                                                response.send(201, item);
                                            }
                                        }
                                    });
                                }

                            }
                        });

                    } else {
                        console.error('Error parsing response from the provider API: ', ex);
                        request.respond(statusCodes.INTERNAL_SERVER_ERROR, 'facebook parse error');
                    }
                } catch (ex) {
                    console.error('Error parsing response from the provider API: ', ex);
                    request.respond(statusCodes.INTERNAL_SERVER_ERROR, 'facebook parse error');
                }
            }

        }
        var reqOptions = {
            uri: url,
            headers: { Accept: "application/json" }
        };
        req(reqOptions, requestCallback);
    }

    //console.log('item outside block '+ item.firstName);
    //check to see if email is already in DB. If so, it means they either already
    //have a custom account


};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message: 'Hello World!' });
};

/**
 * creates random salt so hash is unique
 */
function createSalt() {
    return new Buffer(crypto.randomBytes(bytes)).toString('base64');
}

/**
 * hashes the users password for storage
 */
function hash(text, salt, callback) {
    crypto.pbkdf2(text, salt, iterations, bytes, function(err, derivedKey) {
        if (err) { callback(err); }
        else {
            var h = new Buffer(derivedKey).toString('base64');
            callback(null, h);
        }
    });
}

/**
 * creates a JSON Web Token to return to the client
 */
function zumoJwt(aud, userId, masterKey) {

    function base64(input) {
        return new Buffer(input, 'utf8').toString('base64');
    }

    function urlFriendly(b64) {
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(new RegExp("=", "g"), '');
    }

    function signature(input) {
        var key = crypto.createHash('sha256').update(masterKey + "JWTSig").digest('binary');
        var str = crypto.createHmac('sha256', key).update(input).digest('base64');
        return urlFriendly(str);
    }


    var s1 = '{"alg":"HS256","typ":"JWT","kid":0}';
    var j2 = {
        "exp": new Date().setUTCDate(new Date().getUTCDate() + 4000),
        "iss": "urn:microsoft:windows-azure:zumo",
        "ver": 1,
        "aud": aud,
        "uid": userId
    };
    var s2 = JSON.stringify(j2);
    var b1 = urlFriendly(base64(s1));
    var b2 = urlFriendly(base64(s2));
    var b3 = signature(b1 + "." + b2);
    console.log('jwt: ', [b1, b2, b3].join("."));
    return [b1, b2, b3].join(".");
}

function slowEquals(a, b) {
    var diff = a.length ^ b.length;
    for (var i = 0; i < a.length && i < b.length; i++) {
        diff |= (a[i] ^ b[i]);
    }
    return diff === 0;
}