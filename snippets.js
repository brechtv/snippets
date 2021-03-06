// globals
var all_tags = []
var URL = "https://spreadsheets.google.com/feeds/list/" +
    getSheetId() + "/od6/public/values?alt=json"



var $loading = $('#overlay').hide();
$(document)
    .ajaxStart(function() {
        // $loading.show();
        $(".timeline").css({
            'filter': 'blur(4px)',
            '-webkit-filter': 'blur(4px)',
            '-moz-filter': 'blur(4px)',
            '-o-filter': 'blur(4px)',
            '-ms-filter': 'blur(4px)'
        });
        $(".snippet-tag-link").css({
            'filter': 'blur(2px)',
            '-webkit-filter': 'blur(2px)',
            '-moz-filter': 'blur(2px)',
            '-o-filter': 'blur(2px)',
            '-ms-filter': 'blur(2px)'
        });
    })
    .ajaxStop(function() {
        // $loading.hide();
        $(".timeline, .snippet-tag-link").css({
            'filter': 'blur(0px)',
            '-webkit-filter': 'blur(0px)',
            '-moz-filter': 'blur(0px)',
            '-o-filter': 'blur(0px)',
            '-ms-filter': 'blur(0px)'
        });
    });

// initialize the page
preface()

function preface() {
    $(".timeline").empty()
    var can_post = getUrlParam("post")
    if (can_post == "true") {
        $("#new-snippet-container").show()
        console.log("Can post")
    }
    var introHTML = createSnippetHTML(
        "Pick a tag to get started",
        "pick_a_tag",
        "Pick a tag to see related snippets or pick <i>all</i> to see all available snippets.",
        "Or get a <button class='random-btn' onclick='getRandom()'>random</button> snippet.", "getting started")
    $(".timeline").append(introHTML)
        // call the spreadsheet
    $.getJSON(URL, function(data) {
        $(".snippet-tag-link").remove()
        $("#loading-snippet").remove()
        var results = data.feed.entry;
        results.reverse()
            // render all tags
        $.each(results, function(key, result) {
            var tags_for_snippet = result.gsx$tags.$t
                // add tags to all tags
            var tags = tags_for_snippet.split(",").map(function(str) {
                return str.trim();
            });
            all_tags = all_tags.concat(tags)
        });
        renderAllTagsWithCounts()


    })


}

// main function
function init() {
    all_tags = []
    var can_post = getUrlParam("post")
    if (can_post == "true") {
        $("#new-snippet-container").show()
        console.log("Can post")
    }
    // call the spreadsheet
    $.getJSON(URL, function(data) {
        // clear first, in case it's a re-init
        $(".timeline").empty()
        $(".snippet-tag-link").remove()
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

            // 
            var tag_filter = getUrlParam("tag")
            if (tag_filter && tag_filter != "all") {
                if (snippetData.tags.indexOf(tag_filter) > -1) {
                    $(".timeline").append(snippetHTML)
                }
            } else {
                $(".timeline").append(snippetHTML)
            }

        });

        // initialize all copy buttons
        new ClipboardJS('.copy-btn');
        // render the tags we collected
        renderAllTagsWithCounts()
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
            console.log("Status: " + status);
            console.log(data)
            $("#new-snippet-container").hide()
            setTimeout(function() {
                location.reload()
            }, 500)
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


// when a user clicks a tag
function getRandom() {
    // $(".page-tags").empty()
    $.getJSON(URL, function(data) {
        // clear the timeline first
        $(".timeline").empty()
        var results = data.feed.entry;
        var rn = Math.floor(Math.random() * (results.length - 0)) + 0;
        result = results[rn]
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

        // and add to timeline
        $(".timeline").append(snippetHTML);
        renderAllTagsWithCounts()
    })
}


// when a user clicks a tag
function filterOnTag(tag) {
    if (tag == "all") {
        init()
        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({
                path: newurl
            }, '', newurl);
        }
    } else {
        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?tag=' + tag;
            window.history.pushState({
                path: newurl
            }, '', newurl);
        }
        $(".timeline").html(createSnippetHTML("Loading...", "loading", "Fetching snippets...", "...", "..."))
        $.getJSON(URL, function(data) {
            // clear the timeline first
            $(".timeline").empty()
            var results = data.feed.entry;
            // last snippet to the top
            results.reverse()
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
            renderAllTagsWithCounts()
        });
    }
}

//tags 
// when the user clicks 'more' to show all available tags
function renderAllTagsWithCounts() {
    tags_with_counts = countTags(all_tags)
    tags_html = `<button class='snippet-tag-link' onclick='filterOnTag("all")'>all</button>`
    $.each(tags_with_counts, function(i, v) {
        tags_html += `<button class='snippet-tag-link' onclick='filterOnTag("` + v.tag + `")'>` + v.tag + ` (` + v.value + `)</button>`
    })
    $(".page-tags").html(tags_html)


    function countTags(arr) {
        var counts = {};
        for (var i = 0; i < arr.length; i++) {
            var num = arr[i];
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        var keysSorted = [];
        for (var i in counts) {
            if (counts.hasOwnProperty(i)) {
                keysSorted.push(
                    ({
                        'tag': i,
                        'value': counts[i]
                    })
                );
            }
        }
        keysSorted.sort(function(a, b) {
            return b.value - a.value;
        });
        return keysSorted;
    }
}