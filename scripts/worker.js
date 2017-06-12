/**
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

importScripts('namespace.js', 'data.js');

this.onmessage = function(e) {
  
  var data = e.data;
  var stmt = data.statement;
  var key = data.key;
  var onMessageCallback = function(statement, response) {
    var result = {'statement': statement, 'data': response};
    if (key) {
        result.key = key;
    }
    postMessage(result);
 }
  
  switch(stmt) {
      case 'top': APP.Data.getTopStories(onMessageCallback.bind(this, 'top')); break;
      case 'getID': APP.Data.getStoryById(data.id, onMessageCallback.bind(this, 'getID')); break;
      case 'comment': APP.Data.getStoryComment(data.id,onMessageCallback.bind(this, 'comment')); break;
  }
}

APP.Data = (function() {

  var HN_API_BASE = 'https://hacker-news.firebaseio.com';
  var HN_TOPSTORIES_URL = HN_API_BASE + '/v0/topstories.json';
  var HN_STORYDETAILS_URL = HN_API_BASE + '/v0/item/[ID].json';

  function getTopStories(callback) {
    request(HN_TOPSTORIES_URL, function(evt) {
      callback(evt.target.response);
    });
  }

  function getStoryById(id, callback) {

    var storyURL = HN_STORYDETAILS_URL.replace(/\[ID\]/, id);

    request(storyURL, function(evt) {
      callback(evt.target.response);
    });
  }

  function getStoryComment(id, callback) {

    var storyCommentURL = HN_STORYDETAILS_URL.replace(/\[ID\]/, id);

    request(storyCommentURL, function(evt) {
      callback(evt.target.response);
    });
  }

  function request(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = callback;
    xhr.send();
  }

  return {
    getTopStories: getTopStories,
    getStoryById: getStoryById,
    getStoryComment: getStoryComment
  };

})();
