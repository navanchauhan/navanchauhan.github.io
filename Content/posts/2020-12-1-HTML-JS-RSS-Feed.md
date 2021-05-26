---
date: 2020-12-01 20:52
description: Short code-snippet for an RSS feed, written in HTML and JavaScript
tags: Tutorial, Code-Snippet, HTML, JavaScript
---
# RSS Feed written in HTML + JavaScript

If you want to directly open the HTML file in your browser after saving, don't forget to set `CORS_PROXY=""` 

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>
        RSS Feed
    </title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
</head>
<body>

<h1 align="center" class="display-1">RSS Feed</h1>
<main>
    <div class="container">
    <div class="list-group pb-4" id="contents"></div>
<div id="feed">
</div></div>
</main>

<script src="https://gitcdn.xyz/repo/rbren/rss-parser/master/dist/rss-parser.js"></script>
<script>

const feeds = {
    "BuzzFeed - India": {
      "link":"https://www.buzzfeed.com/in.xml",
      "summary":true
    },
    "New Yorker": {
      "link":"http://www.newyorker.com/feed/news",
    },
    "Vox":{
      "link":"https://www.vox.com/rss/index.xml",
      "limit": 3
    },
    "r/Jokes":{
      "link":"https://reddit.com/r/Jokes/hot/.rss?sort=hot",
      "ignore": ["repost","discord"]
    }
}

const config_extra = {
"Responsive-Images": true,
"direct-link": false,
"show-date":false,
"left-column":false,
"defaults": {
  "limit": 5,
  "summary": true
}
}

const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

var contents_title = document.createElement("h2")
contents_title.textContent = "Contents"
contents_title.classList.add("pb-1")
document.getElementById("contents").appendChild(contents_title)

async function myfunc(key){

  var count_lim = feeds[key]["limit"]
  var count_lim = (count_lim === undefined) ? config_extra["defaults"]["limit"] : count_lim
  
  var show_summary = feeds[key]["summary"]
  var show_summary = (show_summary === undefined) ? config_extra["defaults"]["summary"] : show_summary

  var ignore_tags = feeds[key]["ignore"]
  var ignore_tags = (ignore_tags === undefined) ? [] : ignore_tags

  var contents = document.createElement("a")
  contents.href = "#" + key
  contents.classList.add("list-group-item","list-group-item-action")
  contents.textContent = key
  document.getElementById("contents").appendChild(contents)
  var feed_div = document.createElement("div")
  feed_div.id = key
  feed_div.setAttribute("id", key);
  var title = document.createElement("h2");
  title.textContent = "From " + key;
  title.classList.add("pb-1")
  feed_div.appendChild(title)
  document.getElementById("feed").appendChild(feed_div)
  var parser = new RSSParser();
  var countPosts = 0
  parser.parseURL(CORS_PROXY + feeds[key]["link"], function(err, feed) {
    if (err) throw err;
    feed.items.forEach(function(entry) {
      if (countPosts < count_lim) {

      var skip = false
      for(var i = 0; i < ignore_tags.length; i++) {
        if (entry.title.includes(ignore_tags[i])){
          var skip = true
        } else if (entry.content.includes(ignore_tags[i])){
          var skip = true
        }
      }

      if (!skip) {

      var node = document.createElement("div");
      node.classList.add("card","mb-3");
      var row = document.createElement("div")
      row.classList.add("row","no-gutters")
      
      if (config_extra["left-column"]){
      var left_col = document.createElement("div")
      left_col.classList.add("col-md-2")
      var left_col_body = document.createElement("div")
      left_col_body.classList.add("card-body")
      }
      
      var right_col = document.createElement("div")
      if (config_extra["left-column"]){
        right_col.classList.add("col-md-10")
      }
      var node_title = document.createElement("h5")
      
      node_title.classList.add("card-header")
      node_title.innerHTML = entry.title
      
      node_body = document.createElement("div")
      node_body.classList.add("card-body")
      
      node_content = document.createElement("p")
      
      if (show_summary){
        node_content.innerHTML = entry.content
      }
      node_content.classList.add("card-text")
      
      if (config_extra["direct-link"]){
      node_link = document.createElement("p")
      node_link.classList.add("card-text")
      node_link.innerHTML = "<b>Link:</b> <a href='" + entry.link +"'>Direct Link</a>"
      if (config_extra["left-column"]){
      left_col_body.appendChild(node_link)
        } else {
          node_content.appendChild(node_link)
        }
      }

      if (config_extra["show-date"]){
        node_date = document.createElement("p")
        node_date.classList.add("card-text")
        node_date.innerHTML = "<p><b>Date: </b>" + entry.pubDate + "</p>"
        if (config_extra["left-column"]){
        left_col_body.appendChild(node_date)
          } else {
            node_content.appendChild(node_date)
          
        }
      }

      node.appendChild(node_title)
      
      node_body.appendChild(node_content)
      
      right_col.appendChild(node_body)

      if (config_extra["left-column"]){
        left_col.appendChild(left_col_body)
        row.appendChild(left_col)
      }
      
      row.appendChild(right_col)

      node.appendChild(row)

      document.getElementById(key).appendChild(node)
      countPosts+=1
    }
    }
  })

  if (config_extra["Responsive-Images"]){
  var inputs = document.getElementsByTagName('img')
      for(var i = 0; i < inputs.length; i++) {
        inputs[i].classList.add("img-fluid")
      }
  }

  })

  return true
}
(async () => {
for(var key in feeds) {
  let result = await myfunc(key);
}})();

</script>
<noscript>Uh Oh! Your browser does not support JavaScript or JavaScript is currently disabled. Please enable JavaScript or switch to a different browser.</noscript>
</body></html>
```

