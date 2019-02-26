function compile(sourceCode) {
  // do nothing for now
  analyzer = new SourceAnalyzer();
  return analyzer.getAnalysis();
  //return sourceCode;
}

$(document).ready(function() {
  $('.button-compile').click(function(){
    const input = $('.editor-textbox').first().val();
    const output = compile(input);
    $('.output').first().text(output);
  })
})