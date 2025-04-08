'use strict';

var utils = require('../utils/writer.js');
var ChatService = require('../service/ChatService.js');

module.exports.createChatCompletion = function createChatCompletion(req, res, next, body) {

  const projectId = '902e9bda-956c-46af-ad1f-e6aeaaadd283'
  const min_new_tokens = 50
  const max_new_tokens = 200

  console.log('****createChatCompletion: ', JSON.stringify(body));

  console.log(JSON.stringify(req.headers));

  const apiKey = req.headers['api-key'] //'pXlFhgkg_wfJu2jvLrkNvboGEX4P0hyAX5vm4l8ulSda'
  console.log('****API KEY: ', apiKey);

  ChatService.getBearer(req, apiKey)
    .then(function (bearerTokenResponse) {
      console.log('****bearerToken: ', bearerTokenResponse);
      ChatService.createChatCompletion(body, projectId, bearerTokenResponse, min_new_tokens, max_new_tokens)     
        .then(function (watsonxResponse) {
          utils.writeJson(res, watsonxResponse);
        })
        .catch(function (watsonxResponse) {
          utils.writeJson(res, watsonxResponse);
        });
    })
    .catch(function (bearerTokenResponse) {
      console.log('****bearer error: ', bearerTokenResponse);
      utils.writeJson(res, bearerTokenResponse);
    });
  }