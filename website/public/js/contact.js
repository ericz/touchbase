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
  var settings = [];
  var s = {lineWidth:4, label: 'asdasdff', rendererOptions: {smooth: true}};
  var labels = {fb: 'Facebook (char)', gmail: 'Email (char)', call: 'Phone call (secs)', text: 'Text Message (char)'};
  for(var key in graph) {
    settings.push({lineWidth:4, label: labels[key], rendererOptions: {smooth: true}});
    plot.push(graph[key]);
  }
  $.jqplot.config.enablePlugins=true;
  $.jqplot('chartdiv',  
  plot,
  {
    axes: {
      xaxis: {renderer: $.jqplot.DateAxisRenderer}  ,
      yaxis: {min: 00, pad: 1.6}
    },
    series: settings,
    legend: {show: true, location: 'nw', xoffset: 30}
   
  });
  
});