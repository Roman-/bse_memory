function Glob() { }
Glob.websiteOpened = new Date();

// $(...).tclick: binds function to both touchstart and mousedown
// fun - function to bind
(function ($) {
    $.fn.tclick = function (fun) {
        this.on("touchstart mousedown", function (e) {
            e.preventDefault();
            fun.call(this, e);
        });

        return this;
    };
})(jQuery);

// $(...).trelease: binds function to both touchend and mouseup
// fun - function to bind
(function ($) {
    $.fn.trelease = function (fun) {
        this.on("touchend mouseup", function (e) {
            e.preventDefault();
            fun.call(this, e);
        });

        return this;
    };
})(jQuery);

// $(...).tmove: binds function to both mousemove and touchmove
// fun - function to bind
(function ($) {
    $.fn.tmove = function (fun) {
        this.on("touchmove mousemove", function (e) {
            e.preventDefault();
            fun.call(this, e);
        });

        return this;
    };
})(jQuery);
