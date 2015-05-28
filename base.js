  var startSelectObj,
    endSelectObj;

var userSelection;

$(function(){
  window.my_quote = new Quote(quote1);
  window.quote_ctrl = new QuoteCtrl(my_quote);
  window.view = new View(my_quote, quote_ctrl);
  view.init();
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

function QuoteCtrl(quote) {

  var self = this;
  this.model = quote;

  this.evaluateSelection = function(e) {
      var s = document.getSelection();

      if (!s.toString()){
        window.startSelectObj = null;
        window.endSelectObj = null;
        s.empty();
        return false;
      }

      window.userSelection = new UserSelection();
      window.userSelection.evaluate(s, function(start_end){
        self.model.updateSelection(start_end);
        window.view.renderBlockQuote(self.model.subquotes)
        s.empty();
      })

  }
}

function View(quote, quote_ctrl) {
  var self = this;

  this.ctrl = quote_ctrl;
  
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
