'use strict';
var request = require('request');

/**
 * Get bearer token 
 *
 * returns Bearer Token given API Key
 **/
exports.getBearer = function (req, apiKey) {

  return new Promise(function (resolve, reject) {

    console.log("***getBearer");

    //var requestJson = req.headers.authorization;
    //console.log('*** Auth: ', requestJson);

    console.log('*** ApiKey: ', apiKey);

    var options = {
      'method': 'POST',
      'url': 'https://iam.cloud.ibm.com/identity/token',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: {
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': apiKey
      }
    };

    request(options, function (error, response) {
      if (error) throw new Error(error);

      var responseJson = JSON.parse(response.body);
      console.log(responseJson);

      var accessToken = responseJson.access_token;

      console.log("Token: " + accessToken);

      resolve(accessToken);

    });

  });
}

/**
 * watson AI Service
 * watsonAI Service
 *
 * body Request watsonAiAgent AI prompt
 * projectId String Project Identifier for classification
 * apiKey String Api Key
 * min_new_tokens Integer min length of generated text (optional)
 * max_new_tokens Integer max length of generated text (optional)
 * returns Response
 **/
exports.createChatCompletion = function (body, projectId, token) {

  return new Promise(function (resolve, reject) {

    var bearerToken = "Bearer " + token;
    console.log("Bearer Token: " + bearerToken);

    const min_new_tokens = 50
    const max_new_tokens = body.max_tokens;
    console.log('Max Tokens: ', max_new_tokens);

    const model = body.model;
    console.log('Model: ', model);

    var prompt = body.messages[0].content;
    console.log('Prompt: ', prompt);

    var inputPayload = {
      "input": prompt,
      "parameters": {
        "decoding_method": "greedy",
        "max_new_tokens": max_new_tokens,
        "min_new_tokens": min_new_tokens,
        "stop_sequences": [],
        "repetition_penalty": 1
      },
      "model_id": model,
      "project_id": projectId,
      "moderations": {
        "hap": {
          "input": {
            "enabled": true,
            "threshold": 0.5,
            "mask": {
              "remove_entity_value": true
            }
          },
          "output": {
            "enabled": true,
            "threshold": 0.5,
            "mask": {
              "remove_entity_value": true
            }
          }
        },
        "pii": {
          "input": {
            "enabled": true,
            "threshold": 0.5,
            "mask": {
              "remove_entity_value": true
            }
          },
          "output": {
            "enabled": true,
            "threshold": 0.5,
            "mask": {
              "remove_entity_value": true
            }
          }

        }
      }
    }

    var inputStr = JSON.stringify(inputPayload);
    console.log('***inputStr: ', inputStr);


    var options = {
      'method': 'POST',
      'url': 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29',
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': bearerToken,
      },
      body: inputStr
    }

    var responsePayload = {
      "generated": "Cannot generate",
    };

    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);

      var responseJson = JSON.parse(response.body);

      console.log('***Response code: ', responseJson.status_code);
      console.log('***Response body: ', JSON.stringify(responseJson));

      var generatedTxt = "Cannot generate"
      var generated_token_count = 0
      var prompt_tokens = 0
      var total_tokens = 0
      var ts = 0

      if (responseJson.status_code) {
        // Send back error in response

        const errorResponse = {
          code: "400",
          message: response.body,
          param: "",
          type: "Error"
        }

        resolve(errorResponse);
      }
      else if (responseJson.results[0].generated_text === "") {
        // Send back warnings in response
        const warnings = JSON.stringify(responseJson.system)
        console.log('***Warnings: ', warnings)
        generatedTxt = "Warning: " + warnings

      } else {
        const results = responseJson.results[0]

        generatedTxt = results.generated_text
        console.log('***generatedTxt: ', generatedTxt);

        ts = Math.floor(new Date(responseJson.created_at).getTime() / 1000);

        generated_token_count = results.generated_token_count
        prompt_tokens = results.input_token_count
        total_tokens = results.generated_token_count + results.input_token_count

      }

      var responsePayload = {
        "created": ts,
        "usage": {
          "completion_tokens": generated_token_count,
          "prompt_tokens": prompt_tokens,
          "total_tokens": total_tokens
        },
        "model": model,
        "id": "id-" + ts,
        "choices": [{
          "finish_reason": "stop",
          "index": 0,
          "message": {
            "role": "assistant",
            "content": generatedTxt
          }
        }, {
          "finish_reason": "stop",
          "index": 0,
          "message": {
            "role": "assistant",
            "content": "Not implemented"
          }
        }],
        "object": "chat.completion"
      };


      resolve(responsePayload);

    });

  })
}