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
APP.Main = (function() {

  var LAZY_LOAD_THRESHOLD = 300;
  var $ = document.querySelector.bind(document);

  var stories = null;
  var storyStart = 0;
  var count = 100;
  var main = $('main');
  var inDetails = false;
  var storyLoadCount = 0;
  var localeData = {
    data: {
      intl: {
        locales: 'en-US'
      }
    }
  };

  var tmplStory = $('#tmpl-story').textContent;
  var tmplStoryDetails = $('#tmpl-story-details').textContent;
  var tmplStoryDetailsComment = $('#tmpl-story-details-comment').textContent;

  if (typeof HandlebarsIntl !== 'undefined') {
    HandlebarsIntl.registerWith(Handlebars);
  } else {

    // Remove references to formatRelative, because Intl isn't supported.
    var intlRelative = /, {{ formatRelative time }}/;
    tmplStory = tmplStory.replace(intlRelative, '');
    tmplStoryDetails = tmplStoryDetails.replace(intlRelative, '');
    tmplStoryDetailsComment = tmplStoryDetailsComment.replace(intlRelative, '');
  }

  var storyTemplate =
      Handlebars.compile(tmplStory);
  var storyDetailsTemplate =
      Handlebars.compile(tmplStoryDetails);
  var storyDetailsCommentTemplate =
      Handlebars.compile(tmplStoryDetailsComment);
      
  var storyDetails = document.createElement('section');
  storyDetails.setAttribute('id', 'sd');
  storyDetails.classList.add('story-details');
  document.body.appendChild(storyDetails);

  /**
   * As every single story arrives in shove its
   * content in at that exact moment. Feels like something
   * that should really be handled more delicately, and
   * probably in a requestAnimationFrame callback.
   */
  function onStoryData (key, details) {

    var story = document.getElementById('s-' + key);
    if (story) {
        requestAnimationFrame(function()
        {
            details.time *= 1000;
            var html = storyTemplate(details);
            story.addEventListener('click', onStoryClick.bind(this, details));
            story.classList.add('clickable');
            story.innerHTML = html;

            // Tick down. When zero we can batch in the next load.
            storyLoadCount--;
            // Colorize on complete.
            if (storyLoadCount === 0)
                colorizeAndScaleStories();
        });
    }
  }


  function onStoryClick(details) {
      
    requestAnimationFrame(function() {

    // Create and append the story. A visual change...
    // perhaps that should be in a requestAnimationFrame?
    // And maybe, since they're all the same, I don't
    // need to make a new element every single time? I mean,
    // it inflates the DOM and I can only see one at once.
    
    if (details.url)
      details.urlobj = new URL(details.url);

    var storyDetailsHtml = storyDetailsTemplate(details);
    storyDetails.innerHTML = storyDetailsHtml;
    
    var comment;
    var commentsElement = storyDetails.querySelector('.js-comments');
    //var storyHeader = storyDetails.querySelector('.js-header');
    //var storyContent  = storyDetails.querySelector('.js-content');
    var closeButton = storyDetails.querySelector('.js-close');
    var kids = details.kids;
    var commentHtml = storyDetailsCommentTemplate({
      by: '', text: 'Loading comment...'
    });

    //var headerHeight = storyHeader.getBoundingClientRect().height;
    //storyContent.style.paddingTop = headerHeight + 'px';
    
    closeButton.addEventListener('click', hideStory.bind(this));
    
    // Wait a little time then show the story details.
    setTimeout(showStory.bind(this), 60);

    if (typeof kids === 'undefined')
      return;

    for (var k = 0; k < kids.length; k++) {

      comment = document.createElement('aside');
      comment.setAttribute('id', 'sdc-' + kids[k]);
      comment.classList.add('story-details__comment');
      comment.innerHTML = commentHtml;
      commentsElement.appendChild(comment);
       
      // Update the comment with the live data.
      APP.Data.getStoryComment(kids[k], function(commentDetails) {

          commentDetails.time *= 1000;

          var comment = commentsElement.querySelector(
              '#sdc-' + commentDetails.id);
          comment.innerHTML = storyDetailsCommentTemplate(
              commentDetails,
              localeData);
        });
      }
      
    });
  }

  function showStory() {

    if (inDetails)
      return;

    inDetails = true;

    requestAnimationFrame(function() {
        var storyDetailsPosition = storyDetails.getBoundingClientRect(); 
        var left = storyDetailsPosition.left;
        var documentBoundingRect = document.body.getBoundingClientRect();
        var modStories = document.querySelectorAll('.story');
        var change = [];
        for(var i = 0; i < modStories.length; i++) {
            var boundingRect = modStories[i].getBoundingClientRect();
            if (boundingRect.bottom >= 0 &&
                boundingRect.top < documentBoundingRect.bottom) {
                var story = modStories[i];
                change.push(story);
                change.push(story.querySelector('.story__title'));
                change.push(story.querySelector('.story__by'));
                change.push(story.querySelector('.story__score'));
            }
        }
        
        for (var i = 0; i < change.length; i++) {
            change[i].classList.add('details-active');
        }
        storyDetails.style.opacity = 1;

        function animate () {

          if (!inDetails)
            return;
          // Find out where it currently is.
          // var storyDetailsPosition = storyDetails.getBoundingClientRect(); 
          // Set the left value if we don't have one already.
          //if (left === null)
          //  left = storyDetailsPosition.left;

          // Now figure out where it needs to go.
          // left += (0 - storyDetailsPosition.left) * 0.1;
          left -= left * 0.1;

          // Set up the next bit of the animation if there is more to do.
          if (Math.abs(left) > 0.5)
            requestAnimationFrame(animate);
          else
            left = 0;

          // And update the styles. Wait, is this a read-write cycle?
          // I hope I don't trigger a forced synchronous layout!
          //storyDetails.style.left = left + 'px';
          storyDetails.style.transform = 'translateX('+left+'px)';
        }

        // We want slick, right, so let's do a setTimeout
        // every few milliseconds. That's going to keep
        // it all tight. Or maybe we're doing visual changes
        // and they should be in a requestAnimationFrame
        requestAnimationFrame(animate);
    });
  }

  function hideStory() {

    if (!inDetails)
        return;
    
    inDetails = false;
    var left = 0;
    
    requestAnimationFrame(function() {
        
        //document.body.classList.remove('details-active');
        var modStories = document.querySelectorAll('.story.details-active, .story__title.details-active, .story__by.details-active, .story__score.details-active');
        for(var i = 0; i < modStories.length; i++) {
            modStories[i].classList.remove('details-active');
        }
        storyDetails.style.opacity = 0;

        function animate () {

          if (inDetails)
              return;
          // Find out where it currently is.
          var mainPosition = main.getBoundingClientRect();
          var storyDetailsPosition = storyDetails.getBoundingClientRect();
          var target = mainPosition.width + 100;

          // Now figure out where it needs to go.
          left += (target - storyDetailsPosition.left) * 0.1;

          // Set up the next bit of the animation if there is more to do.
          if (Math.abs(left - target) > 0.5) {
            requestAnimationFrame(animate);
          } else {
            left = target;
            inDetails = false;
          }

          // And update the styles. Wait, is this a read-write cycle?
          // I hope I don't trigger a forced synchronous layout!
          //storyDetails.style.left = left + 'px';
          storyDetails.style.transform = 'translateX('+left+'px)';
        }

        // We want slick, right, so let's do a setTimeout
        // every few milliseconds. That's going to keep
        // it all tight. Or maybe we're doing visual changes
        // and they should be in a requestAnimationFrame
        requestAnimationFrame(animate);
    });
  }

  /**
   * Does this really add anything? Can we do this kind
   * of work in a cheaper way?
   */
  function colorizeAndScaleStories() {

    var storyElements = document.querySelectorAll('.story');

    // Base the scale on the y position of the score.
    var height = main.offsetHeight;
    var documentBoundingRect = document.body.getBoundingClientRect();

    var changes = [];
    // It does seem awfully broad to change all the
    // colors every time!
    for (var s = 0; s < storyElements.length; s++) {

      var story = storyElements[s];
      var storyBoundingRect = story.getBoundingClientRect();
      // Check if story is in current viewport
      if (storyBoundingRect.bottom >= 0 &&
          storyBoundingRect.top < documentBoundingRect.bottom) {
        var score = story.querySelector('.story__circle');
        var title = story.querySelector('.story__title');
        var scoreLocation = storyBoundingRect.top + 16 - documentBoundingRect.top;
        changes.push({'title': title, 
                      'score': score, 
                      'ratio': ((scoreLocation - 170) / height)
                      });
          }
    }

    for (var i = 0; i < changes.length; i++) {
      var story = changes[i];
      var ratio = story.ratio;
      var scale = Math.min(1, 1 - (0.05 * ratio));
      var opacity = Math.min(1, 1 - (0.5 * ratio));
      // Now figure out how wide it is and use that to saturate it.
      var saturation = (100 * ((scale * 40 - 38) / 2));
      story.score.style.transform = 'scale('+scale+')';
      story.score.style.backgroundColor = 'hsl(42, ' + saturation + '%, 50%)';
      story.title.style.opacity = opacity;
    }
  }

  // main.addEventListener('touchstart', function(evt) {

    // I just wanted to test what happens if touchstart
    // gets canceled. Hope it doesn't block scrolling on mobiles...
    // if (Math.random() > 0.97) {
    //  evt.preventDefault();
    // }

  // });

  main.addEventListener('scroll', function() {

    var header = $('header');
    var headerTitles = header.querySelector('.header__title-wrapper');
    var scrollTop = main.scrollTop;
    var scrollHeight = main.scrollHeight;
    var offsetHeight = main.offsetHeight;
    var scrollTopCapped = Math.min(70, main.scrollTop);
    var scaleString = 'scale(' + (1 - (scrollTopCapped / 300)) + ')';

    colorizeAndScaleStories();

    header.style.height = (156 - scrollTopCapped) + 'px';
    headerTitles.style.webkitTransform = scaleString;
    headerTitles.style.transform = scaleString;

    // Add a shadow to the header.
    if (scrollTop > 70)
      document.body.classList.add('raised');
    else
      document.body.classList.remove('raised');

    // Check if we need to load the next batch of stories.
    var loadThreshold = (scrollHeight - offsetHeight -
        LAZY_LOAD_THRESHOLD);
    if (scrollTop > loadThreshold)
      requestAnimationFrame(loadStoryBatch);
  });

  function loadStoryBatch() {

    if (storyLoadCount > 0)
      return;

    storyLoadCount = count;

    var end = storyStart + count;
    for (var i = storyStart; i < end; i++) {

      if (i >= stories.length)
        return;

      var key = String(stories[i]);
      var story = document.createElement('div');
      story.setAttribute('id', 's-' + key);
      story.classList.add('story');
      story.innerHTML = storyTemplate({
        title: '...',
        score: '-',
        by: '...',
        time: 0
      });
      main.appendChild(story);

      APP.Data.getStoryById(stories[i], onStoryData.bind(this, key));
    }

    storyStart += count;

  }

  // Bootstrap in the stories.
  APP.Data.getTopStories(function(data) {
    stories = data;
    loadStoryBatch();
    main.classList.remove('loading');
  });

})();
