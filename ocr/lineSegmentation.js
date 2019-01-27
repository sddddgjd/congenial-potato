const deepcopy = require("deep-copy");
const _ = require('lodash');

const coordinatesHelper = require('./coordinatesHelper');


function getYMax(data) {
    let v = data.textAnnotations[0].boundingPoly.vertices;
    let yArray = [];
    for (let i = 0; i < 4; i++) {
        yArray.push(v[i]['y']);
    }
    return Math.max.apply(null, yArray);
}

export function getByLines(data) {
    return mergeNearByWords(data);
}

/**
 * GCP Vision groups several nearby words to appropriate lines
 * But will not group words that are too far away
 * This function combines nearby words and create a combined bounding polygon
 */

function mergeNearByWords(data) {

    const yMax = getYMax(data);
    data = coordinatesHelper.invertAxis(data, yMax);

    // Auto identified and merged lines from gcp vision
    let lines = data.textAnnotations[0].description.split('\n');
    // gcp vision full text
    let rawText = deepcopy(data.textAnnotations);
    // reverse to use lifo, because array.shift() will consume 0(n)
    lines = lines.reverse();
    rawText = rawText.reverse();
    // to remove the zeroth element which gives the total summary of the text
    rawText.pop();

    let mergedArray = getMergedLines(lines, rawText);

    coordinatesHelper.getBoundingPolygon(mergedArray);
    coordinatesHelper.combineBoundingPolygon(mergedArray);

    // This does the line segmentation based on the bounding boxes
    let finalArray = constructLineWithBoundingPolygon(mergedArray);
    return finalArray
}

// TODO implement the line ordering for multiple words
function constructLineWithBoundingPolygon(mergedArray) {
    let finalArray = [];

    for (let i = 0; i < mergedArray.length; i++) {
        if (!mergedArray[i]['matched']) {
            finalArray.push(mergedArray[i].description)
        } else {
            // arrangeWordsInOrder(mergedArray, i);
            // let index = mergedArray[i]['match'][0]['matchLineNum'];
            // let secondPart = mergedArray[index].description;
            // finalArray.push(mergedArray[i].description + ' ' +secondPart);
            finalArray.push(arrangeWordsInOrder(mergedArray, i));
        }
    }
    return finalArray;
}

// try to merge my words array with google OCR's lines output
// in order to do that, for each line I'm trying to find the closest words(based on the X axis) combination that gives me the desired output
function getDist(word1, word2) {
    return word2.boundingPoly.vertices[0].x - word1.boundingPoly.vertices[0].x
}

function isOnRight(word1, word2) {
    return word2.boundingPoly.vertices[0].y > word1.boundingPoly.vertices[0].y
}
function getMergedLines(lines, rawText) {
    let mergedArray = [];
    lines.forEach((line) => {
        const words = line.split(" ")
        if (line.length && words.length >= 2) {
            let finalSolution = [], bestDist = 10000000

            rawText.forEach((firstWord) => {
                if (firstWord.description === words[0]) {
                    const height = firstWord.boundingPoly.vertices[2].x - firstWord.boundingPoly.vertices[0].x
                    const maxDist = height / 2
                    let pickedWord = [], dist = [], wordsFound = 1, totalDist = (words.length - 1) * height / 2

                    pickedWord[0] = firstWord
                    //couldnt get array.fill function to work 
                    dist[0] = 0
                    for (let i = 1; i < words.length; i++)
                        dist[i] = maxDist

                    rawText.forEach((nextWord) => {
                        const position = words.indexOf(nextWord.description)
                        const wordDist = getDist(firstWord, nextWord)

                        if (firstWord.description == 'Protein' && nextWord.description == 'G') {
                            console.log('PROTEEEINBIIITCH')
                            console.log(wordDist + ' ' + dist[position])
                            console.log(isOnRight(firstWord, nextWord))
                            console.log(position)
                        }
                        if (position !== -1 && position !== 0 && wordDist < dist[position] && isOnRight(firstWord, nextWord)) {
                            if (firstWord.description == 'Protein')
                                console.log('FOUND DIS SOLUTION' + position)
                            totalDist = totalDist - dist[position] + wordDist
                            dist[position] = wordDist
                            if (!pickedWord[position])
                                wordsFound++
                            pickedWord[position] = nextWord
                        }
                    })

                    //yay found a solution
                    if (wordsFound === words.length && totalDist < bestDist) {
                        bestDist = totalDist
                        finalSolution = pickedWord
                    }
                }
            })

            //now that I know the words in my solution, I have to build the binding polygon - taking the utmost left element and utmost right element
            const lastWord = finalSolution[words.length - 1]
            console.log(words)
            if (lastWord.description !== words[words.length - 1])
                console.log('u don goofed this doesnt work')

            let mergedElement = []
            mergedElement.description = line
            mergedElement.boundingPoly = finalSolution[0].boundingPoly
            mergedElement.boundingPoly.vertices[1] = lastWord.boundingPoly.vertices[1]
            mergedElement.boundingPoly.vertices[2] = lastWord.boundingPoly.vertices[2]

            mergedArray.push(mergedElement)
        }
    })


    return mergedArray;
}

function arrangeWordsInOrder(mergedArray, k) {
    let mergedLine = '';
    let line = mergedArray[k]['match'];
    // [0]['matchLineNum']
    for (let i = 0; i < line.length; i++) {
        let index = line[i]['matchLineNum'];
        let matchedWordForLine = mergedArray[index].description;
        let mainX = mergedArray[k].boundingPoly.vertices[0].x;
        let compareX = mergedArray[index].boundingPoly.vertices[0].x;


        if (mergedArray[k].description == 'Calories' || mergedArray[k].description == '170') {
            console.log(mergedArray[k].description + ' ' + mainX)
            console.log(mergedArray[index].description + compareX)
        }

        if (compareX > mainX) {
            mergedLine = mergedArray[k].description + ' ' + matchedWordForLine;
        } else {
            mergedLine = matchedWordForLine + ' ' + mergedArray[k].description;
        }
    }
    return mergedLine;
}
