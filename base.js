var quote1 = "These are all related: You can’t address climate change without fixing agriculture, you can’t fix health without improving diet, you can’t improve diet without addressing income, and so on. The production, marketing and consumption of food is key to nearly everything."
var quote2 = "We must address ourselves seriously, and not a little fearfully, to the problem of human scale. What is it? How do we stay within it? What sort of technology enhances our humanity? What sort reduces it? The reason is simply that we cannot live except within limits, and these limits are of many kinds: spatial, material, moral, spiritual. The world has room for many people who are content to live as humans, but only for a few intent upon living as giants or as gods."

var the_quote = quote2

var quote_obj = [];

var quote,
    subquote = "",
    $startSelectElement,
    $endSelectElement,
    $selected_words,
    $quote_words = $([]),
    quote_words,
    quote_chars,
    selections = [],
    my_quote;
$(document).ready(function(){
  my_quote = new Quote(the_quote)
  //setup
  quote_words = splitQuote(the_quote)
  quote_words.forEach(function(c,i){
    // weird way of doing this...
    $quote_words = $quote_words.add($("<span>" + c + "</span>"))
  })

  $('blockquote#original').append($quote_words)

  $('blockquote#original').mouseup('blockquote#original span', function(e){
    // TODO: handle doubleclick
    var $hoverSpan = $('span:hover');
    var getSelect = document.getSelection();
    $endSelectElement = $(getSelect.focusNode.parentElement)
    $startSelectElement = $(getSelect.anchorNode.parentElement)

    if ($startSelectElement.is($endSelectElement) && $hoverSpan.length) {
      // switch to the current hover, it's more accurate...
      $startSelectElement = $endSelectElement = $hoverSpan;
    }

    // set indexes
    var startIdx,
        start = startIdx = $startSelectElement.index(),
        end = $endSelectElement.index();

    if (start > end) {
      start = end;
      end = startIdx;
    }

    $selected_words = selectWordElements(start, end)

    var is_removal = (
            $startSelectElement.hasClass('selected') &&
            $endSelectElement.hasClass('selected') &&
            my_quote.isInclusive(start,end)
        )

    if (is_removal) {
      my_quote.removeSubQuote(start, end)
      $selected_words.removeClass('selected')
    } else {
      my_quote.addSubQuote(start, end)
      $selected_words.addClass('selected')
    }

    // var text = getSelect.toString()//selectedText(start, end)

    $('textarea#editor').val(my_quote.toString())
    getSelect.empty()
  })
  
});

function splitQuote(quote){
  return quote.trim().split('')
  return quote.trim().split(/\s+/)
}

function selectWordElements(start, end){
  return $quote_words.slice(start, end+1)
}

function selectedText(start, end){
  return quote_words.slice(start, end+1).join(' ')
}

function Quote(original) {
  var self = this;
  this.original = original || ""
  var subQuoteIndexes = [];

  function meldIn(start, end) {
    var start_meld = start,
        end_meld = end,
        this_start,
        this_end;
    for (var i=0; i<subQuoteIndexes.length; i++){
      if (!subQuoteIndexes[i]){
        continue
      }
      this_start = subQuoteIndexes[i][0];
      this_end = subQuoteIndexes[i][1];
      if (start_meld < this_start && this_end < end_meld) {
        subQuoteIndexes[i] = undefined;
        continue
      }
      if (this_start <= start_meld-1 && start_meld-1 <= this_end) {
        subQuoteIndexes[i] = undefined;
        start_meld = Math.min(start_meld, this_start);
      }
      if (this_start-1 <= end_meld && end_meld <= this_end) {
        subQuoteIndexes[i] = undefined;
        end_meld = Math.max(end_meld, this_end);
      }
    }
    subQuoteIndexes.push([start_meld, end_meld])
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
  }

}