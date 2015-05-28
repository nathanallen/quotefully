var quoteCtrl, userSelection;

$(function(){
  window.quoteCtrl = new QuoteCtrl(quote1, Quote, View);
})

function UserSelection() {
  this.range = [{},{}];

  this.evaluate = function(s, next) {
    var anchorOffset = s.anchorOffset,
        focusOffset = s.focusOffset,
        anchorStartIdx = parseInt(s.anchorNode.parentElement.getAttribute('data-start-idx')),
        focusStartIdx = parseInt(s.focusNode.parentElement.getAttribute('data-start-idx'));

    this.range[0].offset_idx = anchorOffset;
    this.range[1].offset_idx = focusOffset;

    this.range[0].start_idx = anchorStartIdx;
    this.range[1].start_idx = focusStartIdx;

    this.range[0].abs_idx = anchorStartIdx + anchorOffset;
    this.range[1].abs_idx = focusStartIdx + focusOffset;

    this.range.sort(function(a,b){
      return a.abs_idx > b.abs_idx;
    });

    next(this.range);

  }
}

function QuoteCtrl(quote_text, QuoteClass, ViewClass) {
  var self = this;
  this.model = new QuoteClass(quote_text);
  this.view = new ViewClass(this.model, this);
  this.view.init();

  this.evaluateSelection = function(e) {
      var s = document.getSelection();

      if (!s.toString()){
        s.empty();
        return false;
      }

      window.userSelection = new UserSelection();
      userSelection.evaluate(s, function(start_end){
        self.model.updateSelection(start_end);
        self.view.renderBlockQuote(self.model.subquotes)
        s.empty();
      })

  }
}

function View(quote, quoteCtrl) {
  var self = this;
  this.model = quote;
  this.ctrl = quoteCtrl;
  
  this.init = function(){
    this.renderBlockQuote();
    this.turnOnSelectionListener();
  }

  this.turnOnSelectionListener = function() {
    function onSelectionMouseUp(e) {
      self.ctrl.evaluateSelection(e);
      $(window).off('mouseup', onSelectionMouseUp);
    }

    $('blockquote').mousedown(function(){
      $(window).on('mouseup', onSelectionMouseUp);
    })
  }

  this.renderBlockQuote = function(snippets){
    snippets = snippets || quote.subquotes;
    $("blockquote #quote").html(
      snippets.map(function(snippet){
        return self.renderSubQuote(snippet);
      })
    );
  }

  this.renderSubQuote = function(snippet){
    return $("<span>", {
      text: snippet.quote,
      class: snippet.is_selected ? "selected" : "",
      'data-start-idx': snippet.start
    });
  }

}

// function exploreSelection(e,s){
//   s = s || document.getSelection();
//   for(var k in s){
//    var output;
//    try {  output = s[k](); } catch(e) { output = s[k] }
//    console.log(k, output)
//   }
// }

// function debugSelection(){
//   console.log("start", startSelectObj)
//   console.log("end", endSelectObj)
// }
