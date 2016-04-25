/*
 * Image preview script 
 * powered by jQuery (http://www.jquery.com)
 * 
 * written by Alen Grakalic (http://cssglobe.com)
 *
 */

this.imagePreview = function(){
    /* CONFIG */

    xOffset = 200;
    yOffset = 1;

    /* END CONFIG */
    $("a.preview").hover(function(e){
            this.t = this.title;
            this.title = "";
            var c = (this.t != "") ? "<br/>" + this.t : "";
            $("body").append("<p id='preview'><img src='"+ this.href +"' alt='Image preview' />"+ c +"</p>");
            $("#preview")
                .css("top",(e.pageY + yOffset) + "px")
                .css("left",(e.pageX - xOffset) + "px")
                .fadeIn("fast");
        },
        function(){
            this.title = this.t;
            $("#preview").remove();
        });
    $("a.preview").mousemove(function(e){
        $("#preview")
            .css("top",(e.pageY + yOffset) + "px")
            .css("left",(e.pageX - xOffset) + "px");
    });
};


// starting the script on page load
$(document).ready(function(){
    imagePreview();
});
