const http = require('http');
const request = require('request');
const util = require('util');
const getRequest = util.promisify(request.get)
const url = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup";
const apiKey = "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf";

let wordmap = new Map()

http.get("http://norvig.com/big.txt").on('response', function (response) {
    response.on('data', function (chunk) {
        processData(chunk);
    });
    response.on('end', function () {
        processAfterEnd().then(res => {
            processLookupData(res);
        }).catch(ex => {
            console.log(ex);
        })

    });
});

let processData = (data) => {
    let dataArray = data.toString().toLowerCase().split(/\s+/)
    dataArray.forEach(item => {
        if (item.trim()) {
            if (wordmap.has(item)) {
                wordmap.set(item, wordmap.get(item) + 1)
            } else {
                wordmap.set(item, 1)
            }
        }
    })
}

let processAfterEnd = () => {
    const mapSort1 = new Map([...wordmap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10));
    let promiseArr = [];
    mapSort1.forEach((val, item) => {
        promiseArr.push(lookUpCall(item, val));
    });
    return Promise.all(promiseArr);
}

let lookUpCall = (text, count) => {
    return getRequest(url + "?key=" + apiKey + "&lang=en-en&text=" + text)
        .then(res => {
            return new Promise((resolve) => {
                resolve({ res, count, text })
            })
        }).catch(err => {

            console.log("Error in lookup for - " + text);
            console.log(err);
            return new Promise((resolve) => {
                resolve({ "res" : "", count, text })
            })
        });
}

let processLookupData = (res) => {
    let response = [];
    res.forEach(result => {
        let lookUpRes = JSON.parse(result.res.body);
        let obj = {};
        obj.word = result.text;
        obj.output = {};        
        obj.output.count = result.count;

        if (lookUpRes.def.length > 0) {
            obj.output.pos = lookUpRes.def[0].pos;
            let syn = [];
            lookUpRes.def[0].tr.forEach(element => {
                if (element.syn && element.syn.length > 0)
                    syn = [...syn, ...element.syn]
            });
            obj.output.syn = syn;
        }

        response.push(obj)
    });

    console.log(response);
}