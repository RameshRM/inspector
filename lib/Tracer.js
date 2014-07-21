var fs = require("fs");

function Tracer(traceName){
    this.id = Date.now();
    this.name = traceName;
    this.methods = [];
    this.anonymous = 0;
}

Tracer.prototype = {
    add: function(path){
        if(path){
            this.methods.push({"name":path});
        }else{
            this.anonymous ++;
            this.methods.push({"name":this.anonymous, "isanonymous": true});
        }
        return {id: this.id, method: this.methods.length};
    }
}

Tracer.stream = function(options, data){
    var id = Date.now();
    var tracerStream = {id: id, traced: data};

    if(options.tofile){
        var filePath = (options.dest || "./") + "traced_" + id + ".json";
        fs.writeFile(filePath, JSON.stringify(tracerStream), function(err){
            console.log(err);
        });
    }else{
        return tracerStream;
    }
}
module.exports = Tracer;