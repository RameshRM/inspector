var walker = require("walk-the-path");
var esprima = require("esprima");
var path = require("path");
var events = require("events");
var escodegen = require("escodegen");
var fs = require("fs");

var eventing = new events.EventEmitter();



var UTF8 = "utf8";
var FNTYPE = "function";
var LEFTCURLY = "{";

var tracers = [];
var traceInstance = require("./Tracer");
var traceModel = null;

eventing.on("tracer.add", addToTracing);
eventing.on("tracer.complete", toTraceStream);
eventing.on("rewrite.injected",writeInjected);

walker.walk("./lib", {}, function(err, files) {
    var processed = 0;
    var todo = files.length;
    files.forEach(function(file, idx) {


        fs.readFile(file, UTF8, function(err, data) {
            injectTracer(file, data);
            traceModel = new traceInstance(file);
            eventing.emit("tracer.add", traceModel);
            processed++;
            if (processed >= todo) {
                eventing.emit("tracer.complete");
            }
        });

    });
});

function addToTracing(tracerModel) {
    tracers.push(tracerModel);
}
function writeInjected(fileName, data){

    var filePath = "./injected" + Date.now() + ".js";

    fs.writeFile(filePath, escodegen.generate(data), function(err){

    });

}
function toTraceStream() {
    traceInstance.stream({
        tofile: true
    }, tracers);
}

function getFunctionBlocks(parsed){
    var fns = [];
    return parsed.body.filter(filterByFnExpr);

}
function filterByFnExpr(parsedEntity){
    return parsedEntity.type === "FunctionDeclaration";
}

function injectTracer(fileName, data){
    var parsed = esprima.parse(data, {range:true});
    getFunctionBlocks(parsed).map(function(fn){
        return fn.body.body.unshift(esprima.parse('tracer.trace();'));
    });

    eventing.emit("rewrite.injected", fileName, parsed);
}
