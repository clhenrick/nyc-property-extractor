var app = app || {};

app.ui = (function(w,d) {

  var el = {
    about : d.getElementById('about'),
    pointer : d.getElementById('pointer'),
    aboutClose : d.getElementById('close-about')
  };

  var closeAbout = function() {
    el.aboutClose.addEventListener("click", function(e){
      if (this.classList != false) {
        el.about.style.height = "350px";
        el.about.style.overflow = "visible";
        this.removeAttribute('class');
        this.innerHTML = "x";
        this.style.fontSize = "1em";
      } else {
        el.about.style.height = "20px";
        el.about.style.overflow = "hidden";
        this.className = "closed";
        this.innerHTML = "&#9660;"
        this.style.fontSize = ".8em";        
      }      
    });
  };

  var init = function() {
    console.log('app.ui init() called');
    app.map.init();
    closeAbout();
  };

  return {
    el : el,
    init : init
  };

})(window, document);

window.addEventListener('DOMContentLoaded', app.ui.init);