﻿jQuery.cachedScript = function (url, options) {

    // Allow user to set any option except for dataType, cache, and url
    options = $.extend(options || {}, {
        dataType: "script",
        cache: true,
        url: url
    });

    // Use $.ajax() since it is more flexible than $.getScript
    // Return the jqXHR object so we can chain callbacks
    return jQuery.ajax(options);
};

function showDetails(key) {

    var meaning = window.wordbyword[key];
    if (meaning) {

        $('#meaningPopup .arabic_word').text(meaning.t);
        $('#meaningPopup .arabic_word').attr('href', 'http://www.almaany.com/en/dict/ar-en/' + meaning.t);

        $('#meaningPopup .frequency').text(meaning.f);
        $('#meaningPopup .bangla_meaning').text(meaning.b);
        $('#meaningPopup .english_meaning').text(meaning.e);
        $('#meaningPopup .lemma').text(meaning.l);
        $('#meaningPopup .lemma').attr('href', 'http://www.almaany.com/en/dict/ar-en/' + meaning.l);
        $('#meaningPopup .lemma_meaning').text(meaning.lb);
        $('#meaningPopup .lemma_frequency').text(meaning.lc);
        $('#meaningPopup .transliteration').text(meaning.tl);
        if (meaning.r) {
            $('#meaningPopup .root').text(meaning.r[0] + ' ' + meaning.r[1] + ' ' + meaning.r[2] + ' ' + (meaning.r[3] || ""));
        } else {
            $('#meaningPopup .root').text("");
        }
        $('#meaningPopup .root_meanings').text(meaning.rm);
        $('#meaningPopup .dictionary a').attr('href', 'http://ejtaal.net/m/aa/#q=' + meaning.r)

        $('#meaningPopup').popup('open');
    }
}

function updateSurahPanel(pageNo) {
    $.each(window.surahs, function (key, value) {
        if (pageNo == value.p) {
            var sura = value.s;

            $('#surahpanel select').val(sura).selectmenu( "refresh" );

            //$("#surahpanel").find('input').prop('checked', false).checkboxradio("refresh");
            //var input = $("#surahpanel").find('input[sura="' + sura + '"]');
            //input.prop('checked', true).checkboxradio("refresh");
            //if (input.position()) {
            //    $("#surahpanel fieldset").scrollTop(input.position().top);
            //}
        }
    });

}
$('#searchPopup').popup({
    afteropen: function (event, ui) {
        if (!window.suraayahmap) {
            $.cachedScript('page/sura_ayah_map.js');
        }
        $('#gotoSurahAyahButton').click(function () {
            gotoSurahAyah($('#jumpTo').val());
        })
        $('#searchPopup .error').hide();

    }
});

function gotoSurahAyah(surahAyah) {
    if (window.suraayahmap) {
        var result = /(\d+).(\d+)/.exec(surahAyah);
        var sura = result[1];
        var ayah = result[2];

        var searchReg = new RegExp(',' + sura + ':' + ayah + '=(\\d+)', "g");
        var pageMatch = searchReg.exec(window.suraayahmap);
        if (pageMatch) {
            var pageNo = pageMatch[1];
            window.highlight = { sura: sura, ayah: ayah };
            $('#searchPopup').popup('close');
            slideToPage(pageNo);
        } else {
            $('#searchPopup .error').show();
        }
    } else {
        $('#searchPopup .error').show();
    }

}

function slideToPage(pageNo) {
    pageNo = parseInt(pageNo);
    if ($.mobile.activePage.is("#home")) {
        if (window.swiper.activeIndex == pageNo - 1) {
            loadPage(pageNo);
        } else {
            window.swiper.slideTo(pageNo - 1);
        }
    } else {
        $('#home').one("pageshow", function (event) {
            window.swiper.slideTo(pageNo - 1);
        });
    }
    //loadPage(pageNo);
}

function highlightSurahAyah() {
    if (window.highlight) {
        var nodes = $('.word[sura="' + window.highlight.sura + '"][ayah="' + window.highlight.ayah + '"]');
        nodes.css('background-color', 'lightgreen');
        window.setTimeout(function () {
            nodes.css('background-color', '');
        }, 3000);
        window.highlight = null;
    }
}

function loadPage(pageNo) {

    var pageStr = "000" + pageNo;
    pageStr = pageStr.substr(pageStr.length - 3);

    var pageDiv = '#page' + pageStr;

    $.cookie('page', pageNo, { path: '/', expires: 30 });
    //createCookie('page', pageNo, 30);

    function postContentLoad() {
        $.mobile.loading('hide');
        highlightSurahAyah();

    }
    // if page is already loaded, nothing to do
    if ($(pageDiv).attr("loaded")) {
        postContentLoad();
        return;
    }
    $(pageDiv).attr("loaded", "true");

    $.mobile.loading('show');
    window.setTimeout(function () {
        $.mobile.loading('hide');
    }, 30000);

    $.ajaxSetup({ cache: true });

    $.get('page/page' + pageStr + '.html', function (response) {

        $('<style type="text/css"> \
					@font-face { \
					 font-family: "page' + pageStr + '"; \
					 src: url("./data/fonts/QCF_P' + pageStr + '.woff") format("woff"); \
					 font-weight: normal; \
					 font-style: normal; \
					} \
					.page' + pageStr + ' { font-family: "page' + pageStr + '"; } \
				</style>' ).appendTo("head");

        $(pageDiv).html(response);

        $.cachedScript('page/page' + pageStr + '.js');

        $(pageDiv + " .word").tooltipster({
            contentAsHTML: true,
            interactive: true,

            functionBefore: function (origin, continueTooltip) {

                var key = $(this).attr("sura") + ":" + $(this).attr("ayah") + ":" + $(this).attr("word");
                var meaning = window.wordbyword[key];
                if (meaning) {
                    origin.tooltipster("content", $("<div>"
                        + "<div class=\"bangla_meaning\">" + meaning.b + "</div> "
                        + "<div class=\"english_meaning\">" + meaning.e + "</div> "
                        + (meaning.l == "" ? "" : "<div class=\"lemma\">যা এসেছে  <span>" + meaning.l + "</span> থেকে।</div>")
                        + (meaning.lb == "" ? "" : "<div class=\"lemma_meaning\">এর অর্থ: <span>" + meaning.lb + "</span></div>")
                        + "<div class=\"meaning_details\" onclick=\"$('" + pageDiv + " .word').tooltipster('hide');showDetails('" + key + "')\"><div>Click me for details</div><div>বিস্তারিত জানতে আমাকে চাপুন</div></div>"
                        + "</div>"));
                    continueTooltip();

                }
            }
        });

        $(pageDiv + " .ayah_number").tooltipster({
            functionBefore: function (origin, continueTooltip) {
                var key = $(this).attr("sura") + ":" + $(this).attr("ayah");
                var translation = window.translation[key];

                origin.tooltipster("content", $("<div>"
                        + "<div class=\"bangla_meaning\">" + translation.b + "</div> "
                        + "<div class=\"english_meaning\">(" + key + ") " + translation.e + "</div> "
                        + "</div>"));
                continueTooltip();
            }
        });

        var firstChar = $(pageDiv + ' .word').first().text(); //.charCodeAt(0).toString(16);
        fontSpy("page" + pageStr, {
            glyphs: firstChar,
            success: function () {

                // After the font is loaded, calculate size of all word. if some word are
                // smaller than 5px width, then those are tajweed symbol, which aren't really
                // actual word in an ayah. So, we need to reset the word number ignoring those
                // symbols.
                var wordNo; var lastAyah;
                $('#page' + pageStr + ' .line').each(function (i, line) {
                    $(line).find('span.word').each(function (i, word) {
                        if (lastAyah != $(word).attr("ayah")) {
                            wordNo = 1;
                        }
                        lastAyah = $(word).attr("ayah");
                        if ($(word).width() > 5) {
                            $(word).attr("word", wordNo++);
                        }
                    })
                });

                postContentLoad();
            },
            failure: function () {
                alert("Unable to download arabic font for this page. You may not be connected to the Internet, or your mobile is just too old.");
            }
        });

    }, 'html');
}


$(document).ready(function () {
    window.swiper = new Swiper('.swiper-container', {
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
        slidesPerView: 1,
        centeredSlides: false,
        scrollbar: '.swiper-scrollbar',
        scrollbarHide: false,
        spaceBetween: 0,
        //loop: true ,
        onSlideChangeEnd: function (swiper) {
            //$(document).ready(function () {
            loadPage(swiper.activeIndex + 1);
            //});
        },
        onInit: function (swiper) {
            var page = parseInt($.cookie('page'));
            if (isNaN(page)) {
                page = 1;
            }
            swiper.slideTo(page - 1);
            if (page == 1)
                loadPage(page);
        }
    });
});

$('#pagejumppanel').on("pageshow", function (event) {
    $('#pagenumberToJump').val(window.swiper.activeIndex + 1).focus().textinput('refresh');
});


$('#home').on("pagecreate", function (event) {
    //$(document).ready(function () {

    $("#surahpanel").on("panelbeforeclose", function () {
        //var container = $('#surah-controlgroup');
        //var group = container.controlgroup("container");
        //group.children().remove();
    });

    $('#surahpanel select').bind( "change", function(event, ui) {
        var suraNo = parseInt($(this).val());
        var sura = window.surahs["surah" + suraNo];
        slideToPage(sura.p);
    });

    $("#surahpanel").on("panelbeforeopen", function () {
        updateSurahPanel(window.swiper.activeIndex + 1);

        //$.mobile.loading('show');
        
        //window.setTimeout(function () {
        //    //value="on" checked="checked"
        //    var container = $('#surah-controlgroup');
        //    var group = container.controlgroup("container");
        //    $.each(window.surahs, function (key, value) {
        //        group.append('<label><input type="radio" name="surah" id="' + key + '" sura="' + value.s + '" page="' + value.p + '" />\
        //                    <span class="surah_name_arabic">' + value.a + '</span>\
        //                    <span class="surah_name_english">' + value.e + '</span>\
        //                    <span class="surah_name_bangla">' + value.b + '</span></label>');
        //    });
        //    container.enhanceWithin().controlgroup("refresh");
        //    $("#surahpanel").trigger("updatelayout");

        //    // preselect the surah which is currently being displayed
        //    updateSurahPanel(window.swiper.activeIndex + 1);

        //    // now hook the click event. Don't hook before pre-selecting surah
        //    container.find('[type="radio"]').on('click', function (event) {
        //        var sura = $(this).attr("sura");
        //        var page = $(this).attr("page");
        //        swiper.slideTo(parseInt(page) - 1, 500, true);
        //        $("#closesurahpanel").click();
        //    });

        //    container.css('overflow', 'scroll');
        //    container.height(window.innerHeight - container.position().top - 50);
        //    $.mobile.loading('hide');

        //}, 500);
    });

    // this is to prevent a bug in jquery mobile.
    document.documentElement.focus();
});

