// var quote = "These are all related: You can’t address climate change without fixing agriculture, you can’t fix health without improving diet, you can’t improve diet without addressing income, and so on. The production, marketing and consumption of food is key to nearly everything."
var quote = "We must address ourselves seriously, and not a little fearfully, to the problem of human scale. What is it? How do we stay within it? What sort of technology enhances our humanity? What sort reduces it? The reason is simply that we cannot live except within limits, and these limits are of many kinds: spatial, material, moral, spiritual. The world has room for many people who are content to live as humans, but only for a few intent upon living as giants or as gods."

//temp globals
var $selected_words,
    $quote_words,
    my_quote;

// jQuery objects
var $expand_btn,
    $collapse_btn;

// modes
var insertion_mode = false;
var selection_mode = true;

$(document).ready(function(){
  my_quote = new Quote(quote)
  $quote_words = renderQuote(my_quote)

  var $edit_panel = $('#edit-panel')
  // expand/collapse quote sections & toggle buttons
  $expand_btn = $('#edit-panel .btn#expand').hide()
  $collapse_btn = $('#edit-panel .btn#collapse').hide()
  $('#edit-panel .btn#expand, #edit-panel .btn#collapse').click(function(){
    $('span#quote span:not(.selected), .btn#collapse, .btn#expand').toggle()
    $('span#quote').toggleClass('collapsed expanded')
  })

  $('.btn#select', $edit_panel).click(function(){
    $(this).toggleClass('active')
    $('.btn#insert', $edit_panel).removeClass('active')
    insertion_mode = false;
    selection_mode = !selection_mode;
  })

  $('.btn#insert', $edit_panel).click(function(){
    $(this).toggleClass('active')
    $('.btn#select', $edit_panel).removeClass('active')
    selection_mode = false;
    insertion_mode = !insertion_mode;
  })

  // handle highlighting
  $('blockquote span#quote').mouseup('blockquote span', function(e){

    if (!$(e.target).hasClass('word')){
      return false;
    }

    start_and_end = findIndexesOfHighlight(e)
    var start = start_and_end[0],
        end = start_and_end[1];
    $selected_words = $quote_words.slice(start, end+1)

    if(insertion_mode) {
      renderInsertArea(start, end, $selected_words, my_quote)
      return;
    }

    if ($(this).hasClass('expanded')) {
      evaluateHighlight(start, end, $selected_words, my_quote)
    }

  })
  
});

function evaluateHighlight(start, end, $selected_words, my_quote) {
  if (my_quote.isInclusive(start, end)) {
    unhighlight(start, end, $selected_words, my_quote);
  } else {
    highlight(start, end, $selected_words, my_quote);
  }

  renderEllision(my_quote, $quote_words)
}

function unhighlight(start, end, $selected_words, my_quote){
  my_quote.removeSubQuote(start, end)
  $selected_words.removeClass('selected')
}

function highlight(start, end, $selected_words, my_quote){
  my_quote.addSubQuote(start, end)
  $selected_words.addClass('selected')
}

function findIndexesOfHighlight() {
  // TODO: handle doubleclick
  var $hoverSpan = $('span#quote span:hover');
  var getSelect = document.getSelection();
  $endSelectElement = $(getSelect.focusNode.parentElement)
  $startSelectElement = $(getSelect.anchorNode.parentElement)
  getSelect.empty()
  
  // if only one element
  if ($startSelectElement.is($endSelectElement) && $hoverSpan.length) {
    // switch to the current hover, it's more accurate...
    $startSelectElement = $endSelectElement = $hoverSpan;
  }
  // TODO refinement: if select action extended outside quote area

  // set indexes
  var startIdx,
      start = startIdx = $startSelectElement.index(),
      end = $endSelectElement.index();

  if (start > end) {
    start = end;
    end = startIdx;
  }

  return [start, end]
}

function renderQuote(my_quote) {
  quote_words = my_quote.words.map(function(word,i){
    var hasPunctuation = word[word.length-1].search(/[.!?;]/) !== -1;
    if (hasPunctuation){
      return "<span class='word'>" + word + "</span> "; // outside space
    } else {
      return "<span class='word'>" + word + " </span>" // inside space
    }
  })
  return $('blockquote #quote').append(quote_words).children()
}

function renderEllision(my_quote, $quote_words) {
  var first, second, start, end,
      qs = my_quote.indexes();

  if (qs.length) {
    $collapse_btn.show()
    $expand_btn.hide()
  } else {
    $collapse_btn.hide()
    $expand_btn.hide()
  }

  $quote_words.removeClass('elide-start elide-end')

  while(qs.length) {
    last = qs.shift();
    next = qs[0]
    if (last === undefined || next == undefined) { break }
    $quote_words.eq(last[1]).addClass('elide-start')
    $quote_words.eq(next[0]).addClass('elide-end')
  }
}

function renderInsertArea(start, end, $selected_words, my_quote) {

    var wasSelected = $selected_words.hasClass('selected')
    $selected_words.removeClass('selected')
                   .addClass('omit');

    var $insert = $('<span class="insert">[<input>]<i class="fa fa-times-circle delete"></i></span>')

    var $del = $('i.delete', $insert)
    $del.click(function(){
      $insert.remove();
      $selected_words.toggleClass('selected omit')
    })

    $selected_words.first().before($insert)

    $('input', $insert).focus()
      .click(function(e){
        $del.show()
      })
      .blur(function(e){
        var annotation = $insert.find('input').val();
        if(!annotation.length){
          $insert.remove();
          $selected_words.addClass(wasSelected ? 'selected' : '')
                         .removeClass('omit')
        } else {
          my_quote.insertAnnotation(annotation, start, end)
        }
      })
      .keypress(function(e){
        var key = e.which || e.keyCode;
        if (key === 13){
          $del.hide()
          my_quote.insertAnnotation($(this).val(), start, end)
        }
      })

}

function Quote(original) {
  var self = this;
  this.original = original.trim() || ""
  this.words = this.original.split(' ')
  var subQuoteIndexes = [];

  function meldIn(start, end) {
    var this_start,
        this_end;

    for (var i=0; i<subQuoteIndexes.length; i++){
      if (!subQuoteIndexes[i]){
        continue
      }
      this_start = subQuoteIndexes[i][0];
      this_end = subQuoteIndexes[i][1];
      if (start < this_start && this_end < end) {
        // subsume
        subQuoteIndexes[i] = undefined;
        continue
      }
      if (this_start-1 <= end && end <= this_end) {
        // extend from start
        subQuoteIndexes[i] = undefined;
        end = Math.max(end, this_end);
        continue;
      }
      if (this_start <= start && start <= this_end+1 ) {
        // extend from end
        subQuoteIndexes[i] = undefined;
        start = Math.min(start, this_start);
        continue;
      }
    }
    subQuoteIndexes.push([start, end])
  }

  function exclude(start, end) {
    var this_start,
        this_end;
    for (var i=0; i<subQuoteIndexes.length; i++){
      var current = subQuoteIndexes[i]
      if (!current){
        continue
      }
      
      this_start = current[0];
      this_end = current[1];

      if (this_start <= start && end <= this_end) {
        if (this_start === start && this_end === end) {
          // remove entirety
          subQuoteIndexes[i] = undefined;
          break
        }

        if (this_start === start) {
          // chop off the front
          subQuoteIndexes[i][0] = end+1;
          break
        }
        if (this_end === end) {
          // chop off the end
          subQuoteIndexes[i][1] = start-1;
          break
        }
        // cut out the middle
        subQuoteIndexes[i] = undefined;
        subQuoteIndexes.push([this_start, start-1], [end+1, this_end])
        break
      }

    }
  }

  function flattenAndSort() {
    var new_list = _.compact(subQuoteIndexes)
    new_list = _.uniq(new_list, false, function(q){return q.toString()})
    subQuoteIndexes = _.sortBy(new_list, function(q){return q[0]})
  }

  this.addSubQuote = function(start, end) {
    meldIn(start, end)
    flattenAndSort()
  };
  this.removeSubQuote = function(start, end) {
    exclude(start, end)
    flattenAndSort()
  };

  this.isInclusive = function(start,end){
    var start_is = false,
        end_is = false,
        this_start,
        this_end;
    for (var i=0; i<subQuoteIndexes.length; i++){
      if (!subQuoteIndexes[i]){
        continue
      }
      this_start = subQuoteIndexes[i][0];
      this_end = subQuoteIndexes[i][1];
      if (
            (this_start <= start && start <= this_end)
              &&
            (this_start <= end && end <= this_end)
          ) {
        return true;
      }
    }
    return false;
  }
  this.toString = function(){
    flattenAndSort()
    var original = self.original,
        output = [],
        q, next, next_str,
        elipssis_period = "[....]",
        elipssis = "[...]",
        str;
    for(var i=0; i<subQuoteIndexes.length; i++){
      q = subQuoteIndexes[i]
      str = original.slice(q[0],q[1]+1).trim()
      output.push(str)
      next = subQuoteIndexes[i+1]
      if ( next !== undefined ) {
        next_str = original.slice(q[1]+1,next[0])
        if (next_str.search(/[.!?;]/) === -1) {
          output.push(elipssis)
        } else {
          output.push(elipssis_period)
        }
      }
    }
    return output.join(' ')
  }

  this.indexes = function(){
    console.log(subQuoteIndexes, subQuoteIndexes.toString())
    return _.clone(subQuoteIndexes);
  }

  this.insertAnnotation = function(note, start, end) {
    console.log("annotation added:", note, start, end)
    // TODO
  }

}