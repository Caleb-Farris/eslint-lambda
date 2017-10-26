'use strict';

console.log('Loading function');

var Linter = require("eslint").Linter,
    AWS = require("aws-sdk");

// This lambda function is invoked right after the source code is uploaded to S3
// from the front end.  The event parameter will be passed the name of the 
// file containing the source data.  
exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    var linter = new Linter(),
        Bucket = "javascript-source-and-software",
        Region = "us-east-1",
        IdentityPoolId = "rarrrrrwll", // *hidden*
        Key = event.key1;

    AWS.config.update({
        region: Region,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IdentityPoolId
        })
    });

    var s3 = new AWS.S3({
        apiVersion: "2006-03-01",
        params: {Bucket: Bucket}
    });

    var params = {
        Bucket: Bucket, 
        Key: Key
    };

    // first, get the source code from S3
    function retrieveSource() {
        return new Promise(function (resolve, reject) {
            s3.getObject(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    reject();
                }
                else {
                    resolve(data.Body.toString());
                }
            });
        });
    }
    
    retrieveSource().then(function (source) {
        var lintData = linter.verify(source, {
            "extends": "eslint:recommended",
            "rules": {  "semi": 2 }  
        }, { filename: Key }); 
        
        // Test to see if any data in lintData
        console.log(lintData[0]);
        
        // Echo back the linting results
        callback(null, lintData);  
        //callback('Something went wrong');
    }); 
};