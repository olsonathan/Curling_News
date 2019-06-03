var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/newsScrape", { useNewUrlParser: true });


// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);


// Routes


app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.teamusa.org/usa-curling/features").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("li.row").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("h3")
        //.child().child()("h3")
       //.text();
      result.summary = $(this)
        .text()
      //  .find("p")
      result.link = $(this)
        .children()
        .attr("href");


      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {

  db.Article.find({})
    .then(function(dbArticle) {
      // If all Notes are successfully found, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });


  // TODO: Finish the route so it grabs all of the articles
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



app.put("/articles/:id", function(req, res) {

  db.Note.remove(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.deleteOne({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


app.get("/notes", function(req, res) {
  // Grab every document in the Articles collection
  db.Note
    .find({})
    .then(function(dbNote) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbNote);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// delete all articles
app.delete("/articles/deleteAll", function(req, res) {
  // Remove all the articles
  db.Article.remove( { } ).then(function(err) {
    res.json(err);
  })
  
    
});

// Delete a note
app.delete("/notes/deleteNote/:note_id/:article_id", function(req, res) {
  // Use the note id to find and delete it
  db.Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
    // if any errors occur...
    if (err) {
      console.log(err);
      res.send(err);
    }
    else { // go update the article now that we're missing a note
      db.Article.findOneAndUpdate({ _id: req.params.article_id }, {$pull: {note: req.params.note_id}})
        .exec(function(err, data) {
          // if any errors occur...
          if (err) {
            console.log(err);
            res.send(err);
          } else {
            res.send(data);
          }
        });
    }
  });
});




// Route for saving an article
app.post("/saved/:id", function(req, res) {  // grab it by the id and save it
  db.Article.findOneAndUpdate({_id: req.params.id}, {$set: {saved: true}})
      .then(function(dbArticle) {
          res.json(dbArticle);
      });
});

app.get("/saved", function(req, res) {
  // Grab every document in the saved collection and populate its notes
  db.Article.find({saved: true}).populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully, send them back to the client
     // res.render("/saved");
     res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
