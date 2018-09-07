// globals
var all_tags = []
var URL = "https://spreadsheets.google.com/feeds/list/" +
    getSheetId() + "/od6/public/values?alt=json"

// initialize the page
init()

// main function
function init() {
    // clear first, in case it's a re-init
    $(".timeline").empty()
    $(".snippet-tag-link").remove()
    // if the url param is present, show the post form
    var can_post = getUrlParam("post")
    if (can_post == "true") {
        $("#new-snippet-container").show()
    }

    // call the spreadsheet
    $.getJSON(URL, function(data) {

        // clear the page and add total snippets
        $("#loading-snippet").remove()
        var results = data.feed.entry;
        results.reverse() // last snippet to the top
        $(".snippet-counter").html(results.length + " snippets found")

        // render each snippet
        $.each(results, function(key, result) {
            // create snippet JSON structure
            var snippetData = createSnippet(
                result.gsx$title.$t,
                result.gsx$title.$t.toLowerCase()
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/[ ]/g, "_"),
                micromarkdown.parse(result.gsx$content.$t),
                micromarkdown.parse(result.gsx$meta.$t),
                result.gsx$tags.$t)

            // add tags to all tags
            var tags = snippetData.tags.split(",").map(function(str) {
                return str.trim();
            });
            all_tags = all_tags.concat(tags)

            // create the HTML for the snippet
            var snippetHTML = createSnippetHTML(
                snippetData.title,
                snippetData.id,
                snippetData.content,
                snippetData.meta,
                snippetData.tags)

            // append the snippet to the timeline
            $(".timeline").append(snippetHTML)
        });

        // initialize all copy buttons
        new ClipboardJS('.copy-btn');
        // render the tags we collected
        renderAllTags()
    })
}

// aux functions

// get sheet id from the script tag
function getSheetId() {
    var scripts = document.getElementsByTagName('script');
    var lastScript = scripts[scripts.length - 1];
    var scriptName = lastScript;
    var sheet = scriptName.getAttribute('data-id');
    if (sheet) {
        return sheet
    } else {
        console.log("No sheet ID present!")
    }

}

// post a new snippet
function newSnippet() {
    snippet = {
            "title": $("#new-snippet-title").val(),
            "content": $("#new-snippet-content").val(),
            "meta": $("#new-snippet-meta").val(),
            "tags": $("#new-snippet-tags").val(),
            "token": $("#new-snippet-token").val()
        }
        // if the token is provided, post it to a webhook
        // everything else is done Zapier side
    if (snippet.token == "AQW") {
        $.post("https://hooks.zapier.com/hooks/catch/2756301/q80edt/", snippet, function(data, status) {
            console.log("Data: " + data + "\nStatus: " + status);
        });
    }
}

// when the user clicks 'more' to show all available tags
function showAllTags() {
    $(".page-tags").empty()
    $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("all")'>all</button>`)
    $.each(all_tags, function(i, v) {
        $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("` + v + `")'>` + v + `</button>`)
    })
}

// when a user clicks a tag
function filterOnTag(tag) {
    if (tag == "all") {
        init()
    } else {
        $(".timeline").html(createSnippetHTML("Loading...", "loading", "Fetching snippets...", "...", "..."))
        $.getJSON(URL, function(data) {
            // clear the timeline first
            $(".timeline").empty()
            var results = data.feed.entry;
            // result counter
            var results_length = 0;

            // render snippets again
            $.each(results, function(key, result) {
                // but only if they contain the tag
                if (result.gsx$tags.$t.includes(tag)) {
                    results_length += 1;
                    // create snippet JSON structure
                    var snippetData = createSnippet(
                        result.gsx$title.$t,
                        result.gsx$title.$t.toLowerCase()
                        .replace(/[^a-zA-Z0-9 ]/g, '')
                        .replace(/[ ]/g, "_"),
                        micromarkdown.parse(result.gsx$content.$t),
                        micromarkdown.parse(result.gsx$meta.$t),
                        result.gsx$tags.$t)

                    // create the HTML for the snippet
                    var snippetHTML = createSnippetHTML(
                        snippetData.title,
                        snippetData.id,
                        snippetData.content,
                        snippetData.meta,
                        snippetData.tags)

                    // update the counter
                    $(".snippet-counter").html(results_length + " snippets found")
                        // and add to timeline
                    $(".timeline").append(snippetHTML);
                }
            });
        });
    }
}

// to extract the url parameter
function getUrlParam(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}

// create a snippet data structure
function createSnippet(title, id, content, meta, tags) {
    // cleaner
    var snippet = {
        "title": title,
        "id": id,
        "content": content,
        "meta": meta,
        "tags": tags
    }
    return snippet
}

// create a snippet HTML template
function createSnippetHTML(title, id, content, meta, tags) {
    // in case there's only one or no tags
    // parse and process tags
    try {
        var snippet_tags = tags.split(",").map(function(str) {
            return str.trim()
        })
    } catch (err) {
        var snippet_tags = tags
    }
    var tags_html = "",
        tags_class = ""
    $.each(snippet_tags, function(i, v) {
        tags_html += `<span class="snippet-tags float-right">` + v + `</span>`;
        tags_class += v + ` `;
    })

    // then create the HTML template
    var template = `<li id="` + id + `" class="snippet-li ` + tags_class + `">
        <span class="snippet-title">` + title + `</span>
         ` + tags_html + `
        <div class="snippet-content">` + content + `</div>
        <div class="snippet-footer">` + meta + `
        <button class="float-right copy-btn"  data-clipboard-action="copy" data-clipboard-target="#` + id +
        ` .snippet-content">copy</button></div></li>`
    return template
}

// render all tags in the global all_tags variable
function renderAllTags() {
    all_tags = all_tags.filter(uniqueTags)
    all_tags.sort()
    $.each(all_tags, function(i, v) {
        if (i < 10) {
            $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("` + v + `")'>` + v + `</button>`)
        }
        if (i == 10) {
            $(".page-tags").append(`<button class='snippet-tag-link' onclick='showAllTags()'>more ...</button>`)
        }
    })
    // to filter to unique tags only
    function uniqueTags(value, index, self) {
        return self.indexOf(value) === index;
    }
}