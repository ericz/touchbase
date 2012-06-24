$(function(){

  var today = new Date();
  var first = new Date(data[data.length-1].date);
  
  var diff = today.getTime() - first.getTime();
  var bucket = diff /6 ;
  
  
  var graph = {};
  
  for(var i = 0, ii = data.length; i < ii; i++) {
    var datum = data[i];
    if(!graph[datum.type] ) {
      graph[datum.type] = [];
    }
    if(datum.length > 1000000) {
      datum.length = 1000000;
    }
    graph[datum.type].push([new Date(datum.date), datum.length]);
  }
  
  delete graph['fb'];
  var plot = [];
  for(var key in graph) {
    console.log(key);
    plot.push(graph[key]);
  }
  var settings = [s];
  var s = {lineWidth:4, rendererOptions: {smooth: true}};
  $.jqplot.config.enablePlugins=true;
  $.jqplot('chartdiv',  
  plot,
  {
    axes: {
      xaxis: {renderer: $.jqplot.DateAxisRenderer},
            
           
    },
    series: settings
    
   
  });
  
});