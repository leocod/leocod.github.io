/*
 *  2015 - WS2014/2015
 *  Multimedia Processing
 *  by Hansjörg Mixdorff & Oliver Lietz
 *  Beuth Hochschule für Technik Berlin - University of Applied Sciences
 *
 *  Authors:
 *      Kaiss Hariri - haririkaiss@gmx.de
 *      Lukas Magedanz - lukas.magedanz@gmail.com
 */

define(function (require) {
    'use strict';

    var d3 = require('./d3.min');

    /*
     * Task 1
     */
    var greyscale = function (r, g, b) {
        return  0.3 * r + 0.6 * g + 0.1 * b;
    };

    /*
     * Task 2
     */
    var getMousePosInCanvas = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();

        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var rgbToYuv = function (r, g, b) {
        var yuv = {y: 0, u: 0, v: 0};

        // Luminance
        yuv.y = r * 0.299 + g * 0.587 + b * 0.114;

        // Chrominance
        yuv.u = (b - yuv.y) * 0.564;
        yuv.v = (r - yuv.y) * 0.713;

        return yuv;
    };

    // Returns an array with length == 64.
    // Contains indices at which pixeldata should be
    // fetched from imagedata of the whole canvas.
    var calculateIndices = function (xInput, yInput, videoWidth, blockSize) {
        var indices = [];
        for (var i = 1; i <= blockSize; i++) {
            var line = ((yInput + i - 1) * videoWidth) + 1;
            for (var j = 0; j < blockSize; j++) {
                var index = line + xInput + j;
                indices.push(index);
            }
        }
        return indices;
    };

    // returns luminance from 'imageData' for all desired 'indices'.
    // 'indices' contains the indices of the desired pixels
    // 'imageData' contains the data of a whole image
    var getLuminanceFromOrig = function (indices, imageData) {
        var result;
        if (imageData.length > indices.length) {
            result = [];

            for (var i = 0; i < indices.length; i++) {
                var newR = imageData[indices[i] * 4 + 0];
                var newG = imageData[indices[i] * 4 + 1];
                var newB = imageData[indices[i] * 4 + 2];
                var yuv = rgbToYuv(newR, newG, newB);

                result.push(yuv.y);
            }

        } else {
            console.error('"getLuminanceFromOrig": Fehler!');
        }
        return result;
    };

    var oneDim2TwoDimArray = function (array) {
        var length = Math.sqrt(array.length);
        var result = [];
        var tmpLen = 0;
        for (var i = 0; i < length; i++) {
            var line = [];
            for (var j = 0; j < length; j++) {
                line.push(array[j + tmpLen]);
            }
            result.push(line);
            tmpLen += length;
        }
        return result;
    };

    /*
     * Task 3
     */
    // from https://github.com/notmasteryet/jpgjs/blob/master/jpg.js
    var zigZagIndices = new Int32Array([
        0,
        1,   8,
        16,  9,  2,
        3,  10, 17, 24,
        32, 25, 18, 11, 4,
        5,  12, 19, 26, 33, 40,
        48, 41, 34, 27, 20, 13,  6,
        7,  14, 21, 28, 35, 42, 49, 56,
        57, 50, 43, 36, 29, 22, 15,
        23, 30, 37, 44, 51, 58,
        59, 52, 45, 38, 31,
        39, 46, 53, 60,
        61, 54, 47,
        55, 62,
        63
    ]);

    // convert 2d array to 1d
    var twoDim2OneDim = function (twoDimArr) {
        var oneDim = [];
        for (var j = 0; j < twoDimArr.length; j++) {
            for (var k = 0; k < twoDimArr[j].length; k++) {
                oneDim.push(twoDimArr[j][k]);
            }
        }
        return oneDim;
    };

    // convert to zigzag
    var oneDim2ZigZag = function (oneDim) {
        var zigzaged = [];
        for (var o = 0; o < zigZagIndices.length; o++) {
            zigzaged.push(oneDim[zigZagIndices[o]]);
        }
        return zigzaged;
    };

    var drawTable = function (data, containerId, breakNumer) {
        var $tableContainer = document.getElementById(containerId),
            tbl = document.createElement('table'),
            tbdy = document.createElement('tbody');

        $tableContainer.innerHTML = '';

        for (var k = 0; k < data.length / breakNumer; k++) {
            var tr = document.createElement('tr'),
                td;

            for (var j = 0; j < breakNumer; j++) {
                td = document.createElement('td');
                td.innerHTML = data[(k * breakNumer) + j];
                tr.appendChild(td);
            }
            tbdy.appendChild(tr);
        }

        tbl.appendChild(tbdy);
        $tableContainer.appendChild(tbl);
    };

    var _toInt = function (value) {
        return parseInt(value, 10);
    };

    var runLengthEncode = function (input) {
        var result = [],
            zeroCount = 0;

        for (var i = 0; i < input.length; i++) {
            var thisInput = _toInt(input[i]),
                next = _toInt(input[i + 1]),
                newIndex = 0;

            while (next === 0) {
                zeroCount++;
                next = _toInt(input[i + 1 + zeroCount]);
                newIndex++;
            }
            result.push([thisInput, zeroCount]);

            zeroCount = 0;
            i = i + newIndex;
        }
        return result;
    };

    var drawRLE = function (data, containerId) {
        var $tableContainer = document.getElementById(containerId);
        $tableContainer.innerHTML = '';

        for (var k = 0; k < data.length; k++) {
            var span = document.createElement('li');
            var elem = document.createElement('kbd');

            elem.innerHTML = data[k];
            span.appendChild(elem);
            $tableContainer.appendChild(span);
        }
    };

    /*
     *  Task 4
     *  http://tandrasz.blogspot.de/2011/10/huffmans-compression-algorithm.html
     */
    var sortNumberAsc = function (a, b) {
        return a[1] - b[1];
    };

    var Node = function () {
        this.left = null;
        this.right = null;
        this.prob = null;
        this.value = null;
        this.code = '';
        this.parent = null;
        this.visited = false;
    };

    var getHuffmanCodes = function (prob) {
        var tree = [];
        var secondTree = [];
        var getNext = function () {
            if (tree.length > 0 && secondTree.length > 0 && tree[0].prob < secondTree[0].prob) {
                return tree.shift();
            }

            if (tree.length > 0 && secondTree.length > 0 && tree[0].prob > secondTree[0].prob) {
                return secondTree.shift();
            }

            if (tree.length > 0) {
                return tree.shift();
            }

            return secondTree.shift();
        };
        var sortedProb = [];
        var codes = [];

        var x = 0;
        for (var elem in prob) {
            sortedProb[x] = [elem, prob[elem]];
            x = x + 1;
        }

        sortedProb = sortedProb.sort(sortNumberAsc);
        x = 0;

        for (var elem in sortedProb) {
            tree[x] = new Node();
            tree[x].prob = sortedProb[elem][1];
            tree[x].value = sortedProb[elem][0];
            x = x + 1;
        }
        while (tree.length + secondTree.length > 1) {
            var left = getNext();
            var right = getNext();
            var newnode = new Node();
            newnode.left = left;
            newnode.right = right;
            newnode.prob = left.prob + right.prob;
            newnode.left.parent = newnode;
            newnode.right.parent = newnode;
            secondTree.push(newnode);
        }

        var currentnode = secondTree[0];
        var code = '';
        while (currentnode) {
            if (currentnode.value) {
                codes[currentnode.value] = code;
                code = code.substr(0, code.length - 1);
                currentnode.visited = true;
                currentnode = currentnode.parent;
            } else if (!currentnode.left.visited) {
                currentnode = currentnode.left;
                code += '0';
            } else if (!currentnode.right.visited) {
                currentnode = currentnode.right;
                code += '1';
            } else {
                currentnode.visited = true;
                currentnode = currentnode.parent;
                code = code.substr(0, code.length - 1);
            }
        }
        return codes;
    };

    var compressHuffman = function (input, codes) {
        var output = input.split('');
        for (var elem in output) {
            output[elem] = codes[output[elem]];
        }
        return output.join('');
    };

    var getHuffmanProbabilities = function (input) {
        var prob = [];
        var x = 0;
        var len = input.length;
        while (x < len) {
            var chr = input.charAt(x);
            if (prob[chr]) {
                prob[chr] = prob[chr] + 1;
            } else {
                prob[chr] = 1;
            }
            x++;
        }

        for (var elem in prob) {
            prob[elem] = prob[elem] / len;
        }
        return prob;
    };

    // http://jsfiddle.net/Lm4Qx/
    // http://bl.ocks.org/mbostock/3184089#graph.json
    // http://bl.ocks.org/robschmuecker/7880033
    var levelWidth = [1];
    var visit = function (parent, visitFn, childrenFn) {
        if (!parent) {
            return;
        }

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    };

    var childCount = function (level, n) {
        if (n.children && n.children.length > 0) {
            if (levelWidth.length <= level + 1) {
                levelWidth.push(0);
            }

            levelWidth[level + 1] += n.children.length;
            n.children.forEach(function (d) {
                childCount(level + 1, d);
            });
        }
    };

    var positionLinkText = function (d) {
        var offset = 20,
            sx = d.source.x,
            sy = d.source.y,
            tx = d.target.x,
            ty = d.target.y,
            x = sx + ((tx - sx) / 2),
            y = sy + ((ty - sy) / 2);

        if (d.source.children[0].name === d.target.name) {
            x = x - offset;
            y = y - offset + 5;
        } else {
            x = x + offset;
            y = y - offset + 5;
        }

        return 'translate(' + x + ',' + y + ')';
    };

    var drawHuffmanTree = function (jsonFile, containerId, w, h) {
        d3.json(jsonFile, function (error, treeData) {

            var width = w ? w : 400,
                height = h ? h : 300,
                radius = 30;

            var root = treeData;
            root.x0 = height / 2;
            root.y0 = 0;

            var tree = d3.layout.tree()
                .size([width, height]);


            childCount(0, root);

            var newHeight = d3.max(levelWidth) * 200;
            tree = tree.size([width, newHeight]);

            // Compute the new tree layout.
            var nodes = tree.nodes(root),
                links = tree.links(nodes);

            // Position svg.
            nodes.forEach(function (d) {
                d.y = (2 * radius) + (d.depth * 140);
            });

            // Create svg.
            var svg = d3.select(containerId).append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g');

            // Create the link lines.
            var diagonal = d3.svg.diagonal()
                .source(function (d) {
                    return {
                        'x': d.source.x,
                        'y': d.source.y
                    };
                })
                .target(function (d) {
                    return {
                        'x': d.target.x,
                        'y': d.target.y
                    };
                })
                .projection(function (d) {
                    return [d.x, d.y];
                });

            var link = svg.selectAll('.link')
                .data(links);

            var linkEnter = link.enter()
                .append('g');

            linkEnter.append('path')
                .attr('class', 'd3-link')
                .attr('d', diagonal);

            linkEnter.append('circle')
                .attr('class', 'd3-link-circle')
                .attr('r', radius / 2)
                .attr('transform', positionLinkText);

            linkEnter.append('text')
                .attr('class', 'd3-link-txt')
                .attr('transform', positionLinkText)
                .attr('dy', '.35em')
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return (d.source.children[0].name === d.target.name) ? 0 : 1;
                });

            // Create the node circles.
            var elem = svg.selectAll('.circle')
                .data(nodes);

            // Create the 'blocks' containing the circle and the text
            var elemEnter = elem.enter()
                .append('g');

            // Create the circle for each block
            elemEnter.append('circle')
                .attr('class', 'd3-circle')
                .attr('r', function (d) {
                    return (d.name.length) ? radius : radius / 4;
                })
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                });

            // Create the text for each block
            elemEnter.append('text')
                .attr('class', 'd3-circle-txt')
                .attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                })
                .attr('dy', '.35em')
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return d.name;
                });
        });
    };

    var drawHuffmanLayer = function (jsonFile, containerId, w, h) {
        d3.json(jsonFile, function (error, treeData) {

            var width = w ? w : 400,
                height = h ? h : 102,
                radius = 30,
                nodes = treeData;

            // Position svg.
            nodes.forEach(function (d, i) {
                var length = nodes.length;
                d.x = (i + 0.5) * (width / length);
                d.y = height / 2;
            });

            // Create svg.
            var svg = d3.select(containerId).append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g');

            // Create the node circles.
            var elem = svg.selectAll('.circle')
                .data(nodes);

            // Create the 'blocks' containing the circle and the text
            var elemEnter = elem.enter()
                .append('g');

            // Create the circle for each block
            elemEnter.append('circle')
                .attr('class', 'd3-circle')
                .attr('r', radius)
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                });

            // Create the text for each block
            elemEnter.append('text')
                .attr('class', 'd3-circle-txt')
                .attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                })
                .attr('dy', '.35em')
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return d.name;
                });
        });
    };

    /*
     * Task 5
     */
    // imageA contains the data of the previous image
    // imageB contains the data of the current image
    var diffImage = function (imageA, imageB, depth, same, diff) {
        var length = imageB.data.length / 4;
        var result = {
            image: imageB,
            cut: false
        };
        var checkSameDiff = (same && diff) ? true : false;

        for (var i = 0; i < length; i++) {
            var r = imageB.data[i * 4 + 0];
            var g = imageB.data[i * 4 + 1];
            var b = imageB.data[i * 4 + 2];

            var prevR = imageA.data[i * 4 + 0];
            var prevG = imageA.data[i * 4 + 1];
            var prevB = imageA.data[i * 4 + 2];

            // Math.abs() returns the absolute value of a number.
            var diffR = Math.abs(r - prevR);
            var diffG = Math.abs(g - prevG);
            var diffB = Math.abs(b - prevB);

            // 'diffAll' contains the absolute sum of each colorchannel.
            var diffAll = Math.abs(greyscale(diffR, diffG, diffB));

            if (diffAll < depth) {
                result.image.data[i * 4 + 0] = 128;
                result.image.data[i * 4 + 1] = 128;
                result.image.data[i * 4 + 2] = 128;
                if (checkSameDiff) {
                    same++;
                }
            } else {
                // 'diffAll' might also be replaced with zeros to get
                // a black Pixel for each difference.
                result.image.data[i * 4 + 0] = diffAll;
                result.image.data[i * 4 + 1] = diffAll;
                result.image.data[i * 4 + 2] = diffAll;
                if (checkSameDiff) {
                    diff++;
                }
            }
        }

        if (checkSameDiff && diff > same) {
            result.cut = true;
        }

        return result;
    };

    var diffBlockImage = function (imageBlocksA, imageBlocksB, depth) {
        var length = imageBlocksB.length,
            result = [];

        for (var i = 0; i < length; i++) {
            //cache frameblock of both images
            var actBlock = imageBlocksB[i];
            var cachedBlock = imageBlocksA[i];

            var blockASumR = 0, blockASumG = 0, blockASumB = 0;
            var blockBSumR = 0, blockBSumG = 0, blockBSumB = 0;
            for (var j = 0; j < actBlock.length; j++) {

                for (var k = 0; k < actBlock.length; k++) {
                    blockASumR = blockASumR + actBlock[j][k][0];
                    blockASumG = blockASumG + actBlock[j][k][1];
                    blockASumB = blockASumB + actBlock[j][k][2];

                    blockBSumR = blockBSumR + cachedBlock[j][k][0];
                    blockBSumG = blockBSumG + cachedBlock[j][k][1];
                    blockBSumB = blockBSumB + cachedBlock[j][k][2];
                }
            }

            //normalizise
            blockASumR = blockASumR / 64;
            blockASumG = blockASumG / 64;
            blockASumB = blockASumB / 64;
            blockBSumR = blockBSumR / 64;
            blockBSumG = blockBSumG / 64;
            blockBSumB = blockBSumB / 64;

            var diffAllR = Math.abs(blockBSumR - blockASumR);
            var diffAllG = Math.abs(blockBSumG - blockASumG);
            var diffAllB = Math.abs(blockBSumB - blockASumB);

            var diffAll = Math.abs(greyscale(diffAllR, diffAllG, diffAllB));
            diffAll = Math.round(diffAll);

            if (diffAll < depth) {
                result.push({
                    difference: diffAll,
                    threshold: 'Dizzerenz unter Schwellwert.'
                });
            } else {
                result.push({
                    difference: diffAll,
                    threshold: 'Schwellwert überschritten.'
                });
            }
        }

        return result;
    };

    var convertImageToBlocks = function (imageData, blockSize, width, height) {
        var length = imageData.data.length / 4,
            pixels = [],
            blocks = [],
            currentBlock = [];

        for (var i = 0; i < length; i++) {
            var pixel = [];

            pixel.push(imageData.data[i * 4 + 0]);
            pixel.push(imageData.data[i * 4 + 1]);
            pixel.push(imageData.data[i * 4 + 2]);
            pixel.push(imageData.data[i * 4 + 3]);

            pixels.push(pixel);
        }

        for (var y = 0; y < height; y += blockSize) {
            for (var x = 0; x < width; x += blockSize) {
                currentBlock = [];
                for (var j = 0; j < blockSize; j++) {
                    currentBlock[j] = [];
                    for (var k = 0; k < blockSize; k++) {
                        currentBlock[j][k] = pixels[((y + k) * width) + (x + j)];
                    }
                }
                blocks.push(currentBlock);
            }
        }
        return blocks;
    };

    // Versuch, Blockweise differenz als Bild darzustellen

    // var diffBlockImage = function (imageBlocksA, imageBlocksB, depth, frame) {
    //     var length = imageBlocksB.length,
    //         result = [];

    //     for (var i = 0; i < length; i++) { //iterate over all Blocks
    //         //cache frameblock of both images
    //         var actBlock = imageBlocksB[i];
    //         var cachedBlock = imageBlocksA[i];

    //         var blockASumR = 0, blockASumG = 0, blockASumB = 0;
    //         var blockBSumR = 0, blockBSumG = 0, blockBSumB = 0;
    //         for (var j = 0; j < actBlock.length; j++) { //iterate over block children

    //             for (var k = 0; k < actBlock.length; k++) {
    //                 blockASumR =  blockASumR + actBlock[j][k][0];
    //                 blockASumG = blockASumG + actBlock[j][k][1];
    //                 blockASumB = blockASumB + actBlock[j][k][2];

    //                 blockBSumR = blockBSumR + cachedBlock[j][k][0];
    //                 blockBSumG = blockBSumG + cachedBlock[j][k][1];
    //                 blockBSumB = blockBSumB + cachedBlock[j][k][2];
    //             }
    //         }

    //         //normalizise
    //         blockASumR = blockASumR / 64;
    //         blockASumG = blockASumG / 64;
    //         blockASumB = blockASumB / 64;
    //         blockBSumR = blockBSumR / 64;
    //         blockBSumG = blockBSumG / 64;
    //         blockBSumB = blockBSumB / 64;

    //         var diffAllR = Math.abs(blockBSumR - blockASumR);
    //         var diffAllG = Math.abs(blockBSumG - blockASumG);
    //         var diffAllB = Math.abs(blockBSumB - blockASumB);

    //         var diffAll = Math.abs(greyscale(diffAllR, diffAllG, diffAllB));
    //         diffAll = Math.round(diffAll);

    //         if (diffAll < depth) {
    //             for (var l = 0; l < actBlock.length; l++) {
    //                 for (var m = 0; m < actBlock.length; m++) {
    //                     actBlock[l][m][0] = 128;
    //                     actBlock[l][m][1] = 128;
    //                     actBlock[l][m][2] = 128;
    //                 }
    //             }
    //         } else {
    //             for (var o = 0; o < actBlock.length; o++) {
    //                 for (var u = 0; u < actBlock.length; u++) {
    //                     actBlock[o][u][0] = 0;
    //                     actBlock[o][u][1] = 0;
    //                     actBlock[o][u][2] = 0;
    //                 }
    //             }
    //         }
    //         result.push(actBlock);
    //     }
    //     // console.log(result);
    //     return result;
    // };

    // var convertBlocksToImage = function (blockData, blockSize, width, height, resultImage) {
    //    // var resultImage = ctx.createImageData(width, height);
    //     var length = resultImage.data.length;
    //      var horBlockLen = width / blockSize;

    //     var yCounter = 0;
    //     var xCounter = 0;
    //     for (var i = 0; i < length; i++) {
    //         var actBlock = blockData[i];
    //         if(actBlock){
    //             var wie = actBlock[1][2][3];
    //             // if ((i % horBlockLen) === 0) {
    //             if ((i % horBlockLen) === 0) {
    //                 yCounter += width;
    //                 xCounter = 0;
    //             }
    //             xCounter += blockSize;

    //             for (var j = 0; j < blockSize - 1; j++) {
    //                 for (var k = 0; k <  blockSize - 1; k++) {

    //                     var yIndex = yCounter + (j * width),
    //                         xIndex = (xCounter + k),

    //                         index = yIndex + xIndex;

    //                     resultImage.data[index + 0] = actBlock[j][k][0];
    //                     resultImage.data[index + 1] = actBlock[j][k][1];
    //                     resultImage.data[index + 2] = actBlock[j][k][2];
    //                     // resultImage.data[yCounter + k + xCounter + j + 1] = actBlock[j][k][1];
    //                     // resultImage.data[yCounter + k + xCounter + j + 2] = actBlock[j][k][2];

    //                 }
    //             }
    //         }

    //     }
    //     return resultImage;
    // };

    // var calcBlockAverageRGB = function (blockData) {
    //     var length = blockData.length / 4,
    //         result = [0, 0, 0, 0],
    //         r = 0,
    //         g = 0,
    //         b = 0;

    //     for (var i = 0; i < length; i++) {
    //         r += blockData[i * 4 + 0];
    //         g += blockData[i * 4 + 1];
    //         b += blockData[i * 4 + 2];
    //     }

    //     result[0] = r / length;
    //     result[1] = g / length;
    //     result[2] = b / length;

    //     return result;
    // };




    return {
        // Task 1
        greyscale: greyscale,

        // Task 2
        getMousePosInCanvas: getMousePosInCanvas,
        rgbToYuv: rgbToYuv,
        calculateIndices: calculateIndices,
        getLuminanceFromOrig: getLuminanceFromOrig,
        oneDim2TwoDimArray: oneDim2TwoDimArray,

        // Task 3
        twoDim2OneDim: twoDim2OneDim,
        oneDim2ZigZag: oneDim2ZigZag,
        drawTable: drawTable,
        runLengthEncode: runLengthEncode,
        drawRLE: drawRLE,

        // Task 4
        getHuffmanProbabilities: getHuffmanProbabilities,
        getHuffmanCodes: getHuffmanCodes,
        compressHuffman: compressHuffman,
        drawHuffmanLayer: drawHuffmanLayer,
        drawHuffmanTree: drawHuffmanTree,

        // Task 5
        diffImage: diffImage,
        convertImageToBlocks: convertImageToBlocks,
        diffBlockImage: diffBlockImage
    };
});