function Snippet(text, start, end, is_selected) {
  this.quote = text;
  this.start = start || 0;
  this.end = end || text.length;
  this.is_selected = is_selected || false;
}

function Quote(text) {
  var self = this;
  this.selections = []; // selection indicies
  this.subquotes = [new Snippet(text)];
  this.text = text;

  this.selectionsString = function(){
    return self.selections.map(function(range){
      return range && text.slice(range[0], range[1])
    }).join("|")
  }

  this.selectionData = function(){
    flattenAndSort();

    var output = [],
        _selections = _.clone(self.selections),
        offset = 0,
        next,
        left,
        right;

    while(_selections.length){
      next = _selections.shift()
      left = next[0];
      right = next[1];

      if (offset !== next[0]){
        output.push(new Snippet(
          text.slice(offset, left),
          offset,
          left
        ));
      }

      output.push(new Snippet(
        text.slice(left, right),
        left,
        right,
        true
      ));

      // console.log(output[output.length-1])

      offset = right;
    }

    if (offset < text.length) {
      output.push(new Snippet(
        text.slice(offset),
        offset,
        text.length - offset
      ));
    }

    return output;
  }

  function debug(){
    console.log("subquotes:", self.selectionsString());
    console.log("indicies", self.selections.join("|"));
  }

  this.updateSelection = function(start_end) {
    var start = start_end[0],
        end = start_end[1];

    if (start.start_idx === end.start_idx && this.isInclusive(start.abs_idx, end.abs_idx)){
      exclude(start.abs_idx, end.abs_idx)
    } else {
      meldIn(start.abs_idx, end.abs_idx)
    }
    this.subquotes = this.selectionData();
    return this.subquotes;
  }

  function meldIn(start, end) {
    console.log("including", start, end)
    var this_start,
        this_end;

    for (var i=0; i<self.selections.length; i++){
      if (!self.selections[i]){
        continue
      }
      this_start = self.selections[i][0];
      this_end = self.selections[i][1];
      if (start < this_start && this_end < end) {
        console.log("subsuming")
        // subsume
        self.selections[i] = undefined;
        continue
      }
      if (this_start <= end && end <= this_end) {
        console.log("extend from start")
        // extend from start
        self.selections[i] = undefined;
        end = Math.max(end, this_end);
        continue;
      }
      if (this_start <= start && start <= this_end ) {
        // extend from end
        console.log("extend from end")
        self.selections[i] = undefined;
        start = Math.min(start, this_start);
        continue;
      }
    }
    self.selections.push([start, end])
    console.log("included", start, end)
  }

  function exclude(start, end) {
    console.log("excluding", start, end)
    if (start == end) {
      console.log("nope", start, end)
      return false
    }
    var this_start,
        this_end;
    for (var i=0; i<self.selections.length; i++){
      var current = self.selections[i]
      if (!current){
        continue
      }
      
      this_start = current[0];
      this_end = current[1];

      if (this_start <= start && end <= this_end) {
        if (this_start === start && this_end === end) {
          // remove entirety
          self.selections[i] = undefined;
          break
        }

        if (this_start === start) {
          // chop off the front
          console.log("chop front")
          self.selections[i][0] = end;
          break
        }
        if (this_end === end) {
          console.log("chop end")
          // chop off the end
          self.selections[i][1] = start;
          break
        }
        // cut out the middle
        self.selections[i] = undefined;
        self.selections.push([this_start, start], [end, this_end])
        break
      }

    }
    console.log("excluded", start, end)
  }

  function flattenAndSort() {
    var new_list = _.compact(self.selections)
    new_list = _.uniq(new_list, false, function(q){return q.toString()})
    self.selections = _.sortBy(new_list, function(q){return q[0]})
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
    for (var i=0; i<self.selections.length; i++){
      if (!self.selections[i]){
        continue
      }
      this_start = self.selections[i][0];
      this_end = self.selections[i][1];
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

}