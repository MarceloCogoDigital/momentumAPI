/**
 * Called when the user elects to quit a challenge. 
 */

exports.post = function(request, response) {
    
    //store data sent from app THIS IS A TEST PLEASE WORK    
    var item = {
        User_idUser : request.body.idUser,
        soloChallenge_idsoloChallenge : request.body.soloChallenge_idsoloChallenge
    };
    
    
    
    
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};