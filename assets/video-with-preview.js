
var videoPreviews = document.querySelectorAll(".Preview_preview__");
  
for (var i = 0; i < videoPreviews.length; i++) {
 videoPreviews[i].addEventListener('click', expandVideo, false);
}

function expandVideo() {
  if(!this.classList.contains('Preview_fullScreen__')) {
  this.classList.add('Preview_fullScreen__');
  }else{
      this.classList.remove('Preview_fullScreen__');
  }
}