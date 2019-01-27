const inside = require('point-in-polygon');

function invertAxis(data, yMax) {
    data = fillMissingValues(data);
    for (let i = 1; i < data.textAnnotations.length; i++) {
        let v = data.textAnnotations[i].boundingPoly.vertices;
        let yArray = [];
        for (let j = 0; j < 4; j++) {
            v[j]['y'] = (yMax - v[j]['y']);
        }
    }
    return data;
}

function fillMissingValues(data) {
    for (let i = 1; i < data.textAnnotations.length; i++) {
        let v = data.textAnnotations[i].boundingPoly.vertices;
        if (v['x'] == undefined) {
            v['x'] = 0;
        }
        if (v['y'] == undefined) {
            v['y'] = 0;
        }
    }
    return data;
}

function getBoundingPolygon(mergedArray) {
    yMax = 100000
    for (let i = 0; i < mergedArray.length; i++) {
        let v = [];

        // calculate line height
        let h = mergedArray[i].boundingPoly.vertices[2].x - mergedArray[i].boundingPoly.vertices[0].x;
        let avgHeight = h * 0.5;

        v.push(mergedArray[i].boundingPoly.vertices[0]);
        v.push(mergedArray[i].boundingPoly.vertices[1]);
        v.push(mergedArray[i].boundingPoly.vertices[2]);
        v.push(mergedArray[i].boundingPoly.vertices[3]);

        mergedArray[i]['bigbb'] = [[v[0].x - avgHeight, v[0].y], [v[0].x - avgHeight, yMax], [v[3].x + avgHeight, yMax], [v[3].x + avgHeight, v[0].y]]
        mergedArray[i]['lineNum'] = i;
        mergedArray[i]['match'] = [];
        mergedArray[i]['matched'] = false;
    }

}


function combineBoundingPolygon(mergedArray) {
    // select one word from the array
    for (let i = 0; i < mergedArray.length; i++) {
        let bigBB = mergedArray[i]['bigbb'];
        // iterate through all the array to find the match
        for (let k = 0; k < mergedArray.length; k++) {
            // Do not compare with the own bounding box and which was not matched with a line
            if (k !== i && mergedArray[k]['matched'] === false) {
                let insideCount = 0;
                for (let j = 0; j < 4; j++) {
                    let coordinate = mergedArray[k].boundingPoly.vertices[j];
                    if (inside([coordinate.x, coordinate.y], bigBB)) {
                        insideCount += 1;
                    }
                }
                if (mergedArray[i].description == 'Calories' && mergedArray[k].description == '170') {
                    //  console.log(bigBB)
                    // console.log(mergedArray[k].boundingPoly)
                }
                // all four point were inside the big bb
                if (insideCount === 4) {
                    let match = { matchCount: insideCount, matchLineNum: k };
                    mergedArray[i]['match'].push(match);
                    mergedArray[k]['matched'] = true;
                }

            }
        }
    }
}

var exports = module.exports = {};

exports.invertAxis = function (data, yMax) {
    return invertAxis(data, yMax);
};

exports.getBoundingPolygon = function (mergedArray) {
    return getBoundingPolygon(mergedArray);
};

exports.combineBoundingPolygon = function (mergedArray) {
    return combineBoundingPolygon(mergedArray);
};
