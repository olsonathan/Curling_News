// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append( data[i].title + "<p data-id='" + data[i]._id + "'>" + "<br />" + data[i].summary + data[i].link + "</p>" +
    "<h5>" + "<a href='" + data[i].link + "'>" + "Article link" + '</a>' + "</h5>" + "<button class='save-article' type='submit' data-id='" + data[i]._id + "'>" + "Save Article" + "</button></div></div>")

  }
});


// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title'>");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
      $("#notes").append("<button data-id='" + data._id + "' class='home'>Close</button>");

      
     
      // If there's a note in the article
      if (data.note) {
        
        // An input to enter a new title
      $("#notes").append("<h3>" + "Saved Notes" + "</h3>");
    
      $("#notes").append("<input id='Stitleinput' name='title'>");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='Sbodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append(
      "<button data-id='" + data.note._id + "' articleId='" + thisId + "' id='deletenote'>Delete Note</button>");

        // Place the title of the note in the title input
        $("#Stitleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#Sbodyinput").val(data.note.body);
        
      }
      
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
     $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

// When you click the deletenote button
$(document).on("click", "#deletenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  var articleId = $(this).attr("articleId");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "DELETE",
    url: "/notes/deleteNote/" + thisId, // + "/" + articleId,
  })
  .done(function(data) { // hide the modal
    $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});



$(".scrape-new").click(function(event) {
  event.preventDefault();
  $.get("/scrape").then(function(data) {
      $("#articles").remove();
      $.get("/").then(function(){
        //  bootbox.alert("<h3 class='text-center m-top-80'>" + data.message + "<h3>", function(result) {
            location.reload()
        //  });
      });
      //location.reload();
  });
});


// When you click the delete button
$(document).on("click", ".clear", function() {
  // Grab the id associated with the article from the delete button
  // empty the article container
  $("#articles").empty();
  // run a call to delete the articles
   $.ajax({
      method: "DELETE",
      url: "/articles/deleteAll" 
    })
    // With that done...
    .done(function(data) { // refresh the page
 location.reload();
    });

});

$(document).on("click", ".save-article", function() {
  // Grab the id associated with the article from the save-article button
  var thisId = $(this).attr("data-id");

  // Run POST method
  $.ajax({
      method: "POST",
      url: "/saved/" + thisId,
    })
    // With that done...
    .done(function(data) { // refresh the page
    console.log("article saved: " + data);
    alert("Your Article has been saved")
     // location.reload();
    });

});

// when you click on view saved
$("#view-saved").on("click", function() {
  $.getJSON("/saved", function(data) {
     // hide articles and show saved
     $("#articles").hide();
      $("#savedArticles").show();
      $("#savedArticles").empty();
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the information on the page
       $("#savedArticles").append("<div class='panel panel-primary'> <div class='panel-heading'><h3 data-id='" + data[i]._id + "'>" + data[i].title + "<br />" +  "</h3></div>" + "<div class='panel-body'><p1>" + data[i].summary + "</p1>" + "<br>" +
      "<h5>" + "<a href='" + data[i].link + "'>" + "Article link" + '</a>' + "</h5>" +
       "<button class='home' type='button' data-target='#noteModal' data-toggle='modal' data-id='" + data[i]._id + "'>" + "Home" + "</button>" +
        "<button class='delete-article' type='submit' data-id='" + data[i]._id + "'>" + "Delete Article" + "</button></div></div>"  + "<br>" + "<br>" + "<br>"
      );
    }
  });
 });

 $(document).on("click", ".delete-article", function() {
  // Grab the id associated with the article from the delete button
  var thisId = $(this).attr("data-id");

  // Run POST method
  $.ajax({
      method: "POST",
      url: "/deleteSaved/" + thisId,
    })
    // With that done...
    .done(function(data) { // refresh the page
 location.reload();
    });

});

$(document).on("click", ".home", function() {
  // Grab the id associated with the article from the delete button
  var thisId = $(this).attr("data-id");

  // Run POST method
  $.ajax({
      method: "GET",
      url: "/",
    })
    // With that done...
    .done(function(data) { // refresh the page
 location.reload();
    });

});