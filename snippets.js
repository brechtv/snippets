createWebsite("1aF7Tn6uHd3iUC9ST2O23LiPFK3MpK3Xv3tKR2f1E7vI")

function createWebsite(id) {
    var URL = "https://spreadsheets.google.com/feeds/list/" + id + "/od6/public/values?alt=json"
    $.getJSON(URL, function(data) {
        var tags = []
        var results = data.feed.entry;
        results.reverse() // last snippet to the top
        var webpage_title = data.feed.title.$t;

        $.each(results, function(key, result) {
            var snippet = {
                "meta": result.gsx$meta.$t,
                "title": result.gsx$title.$t,
                "title_id": result.gsx$title.$t.toLowerCase()
                    .replace(/[^a-zA-Z0-9 ]/g, '')
                    .replace(/[ ]/g, "_"),
                "content": micromarkdown.parse(result.gsx$content.$t),
                "tags": result.gsx$tags.$t
            }
            tags.push(snippet.tags)
            var template = `<li id="` + snippet.title_id + `" class="snippet-li ` + snippet.tags + `">
                            <a class="snippet-title" href="#` + snippet.title_id + `">` + snippet.title + `</a>
                            <span class="snippet-tags float-right">` + snippet.tags + `</span>
                            <p class="snippet-content">` + snippet.content + `</p>
                            <p class="snippet-footer">` + snippet.meta + `</p>
                        </li>`
            $(".timeline").append(template).hide().slideDown(200);
        });
        tags = tags.filter(uniqueTags)

        $.each(tags, function(i, v) {
            $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("` + v + `")'>` + v + `</button>`)
        })
    })
}

function filterOnTag(tag) {
    if(tag == "all") {
        $(".snippet-li").show()
    } else {
    $(".snippet-li").hide()
    $("." + tag).show()
    }
}

function uniqueTags(value, index, self) {
    return self.indexOf(value) === index;
}