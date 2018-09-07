var tags = []
init("1aF7Tn6uHd3iUC9ST2O23LiPFK3MpK3Xv3tKR2f1E7vI")


function init(id) {
    var can_post = getUrlParam("post")
    if(can_post == "true") {$("#new-snippet-container").show()}
    var URL = "https://spreadsheets.google.com/feeds/list/" + id + "/od6/public/values?alt=json"
    $.getJSON(URL, function(data) {
        $("#loading-snippet").remove()
        
        var results = data.feed.entry;
        results.reverse() // last snippet to the top
        var webpage_title = data.feed.title.$t;
        $(".snippet-counter").html(results.length + " snippets found")

        $.each(results, function(key, result) {
            var snippet = {
                "meta": micromarkdown.parse(result.gsx$meta.$t),
                "title": result.gsx$title.$t,
                "title_id": result.gsx$title.$t.toLowerCase()
                    .replace(/[^a-zA-Z0-9 ]/g, '')
                    .replace(/[ ]/g, "_"),
                "content": micromarkdown.parse(result.gsx$content.$t),
                "tags": result.gsx$tags.$t
            }

            snippet_tags = snippet.tags.split(",").map(function(str) {
                return str.trim();
            });
            tags = tags.concat(snippet_tags)

            tags_html = ""
            tags_class = ""
            $.each(snippet_tags, function(i, v) {
                tags_html += `<span class="snippet-tags float-right">` + v + `</span>`
                tags_class += v + ` `
            })

            var template = `<li id="` + snippet.title_id + `" class="snippet-li ` + tags_class + `">
                            <a class="snippet-title" href="#` + snippet.title_id + `">` + snippet.title + `</a>
                             ` + tags_html + `
                            <div class="snippet-content">` + snippet.content + `</div>
                            <div class="snippet-footer">` + snippet.meta + `
                            <button class="float-right copy-btn"  data-clipboard-action="copy" data-clipboard-target="#` + snippet.title_id +
                ` .snippet-content">copy</button></div>
                        </li>`
            $(".timeline").append(template).hide().slideDown(200);
        });

        new ClipboardJS('.copy-btn');

        tags = tags.filter(uniqueTags)
        tags.sort()

        $.each(tags, function(i, v) {
            if (i < 10) {
                $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("` + v + `")'>` + v + `</button>`)
            }
            if (i == 10) {
                $(".page-tags").append(`<button class='snippet-tag-link' onclick='showAllTags()'>more ...</button>`)
            }
        })


    })


}

function newSnippet() {
        snippet = {
            "title": $("#new-snippet-title").val(),
            "content": $("#new-snippet-content").val(),
            "meta": $("#new-snippet-meta").val(),
            "tags": $("#new-snippet-tags").val()
        }
        //https://hooks.zapier.com/hooks/catch/2756301/q80edt/
        console.log(snippet)
        $.post("https://hooks.zapier.com/hooks/catch/2756301/q80edt/", snippet, function(data, status){
        console.log("Data: " + data + "\nStatus: " + status);
    });
}

function showAllTags() {
    $(".page-tags").empty()
    $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("all")'>all</button>`)
    $.each(tags, function(i, v) {
        $(".page-tags").append(`<button class='snippet-tag-link' onclick='filterOnTag("` + v + `")'>` + v + `</button>`)
    })
}

function filterOnTag(tag) {
    if (tag == "all") {
        $(".snippet-li").show()
        $(".snippet-counter").html($(".snippet-li").length + " snippets found")
    } else {
        $(".snippet-li").hide()
        $("." + tag).show()
        counter_suffix = ($("." + tag).length == 1 ? " snippet found" : " snippets found")
        $(".snippet-counter").html($("." + tag).length + counter_suffix)
    }
}

function uniqueTags(value, index, self) {
    return self.indexOf(value) === index;
}

function getUrlParam( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}