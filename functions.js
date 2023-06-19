function isCircularLine(lineId, sourceNodeId) {

    let finalTarget = sourceNodeId;
    do {
        let edge = document.querySelector('.edge[data-line-id="' + lineId + '"][data-origin-node-id="' + sourceNodeId + '"]') ?? null;
        if (!edge) {
            return false;
        }

        let targetNode = document.querySelector('.node#' + edge.getAttribute('data-target-node-id')) ?? null;
        if (!targetNode) {
            return false;
        }

        sourceNodeId = targetNode.getAttribute('id');
    } while (finalTarget !== sourceNodeId);

    return true;
}

function dispatchEvent(eventName, eventData) {
    document.dispatchEvent(new CustomEvent(eventName, {detail: eventData}));
}

function createNodeElement(x, y,quadrantX, quadrantY) {
    let title = generateIdString();
    return'<div ' +
        'id="node_' + title + '" ' +
        'data-quadrant-x="' + quadrantX + '" ' +
        'data-quadrant-y="' + quadrantY + '" ' +
        'data-title="' + title + '" ' +
        'data-connected-nodes="[]" ' +
        'class="node new-node" style="' +
        'width: ' + nodeSize + 'px; ' +
        'height: ' + nodeSize + 'px;' +
        'left:' + x + 'px; ' +
        'top: ' + y + 'px"' +
        '><span class="node-title">' + title + '</span>'+
        '</div>';
}

function createBaseNodeHtmlElement(id, title, top, left, quadrantX, quadrantY, connectedNodes, bigNode) {
    return'<div ' +
        'id="' + id + '" ' +
        'data-quadrant-x="' + quadrantX + '" ' +
        'data-quadrant-y="' + quadrantY + '" ' +
        'data-title="' + title + '" ' +
        'data-connected-nodes="[' + connectedNodes.join(', ') + ']" ' +
        'class="node new-node ' + bigNode + '" style="' +
        'width: ' + nodeSize + 'px; ' +
        'height: ' + nodeSize + 'px;' +
        'left:' + left + 'px; ' +
        'top: ' + top + 'px"' +
        '><span class="node-title">' + title + '</span>'+
        '</div>';
}

function createBaseEdgeHtmlElement(id, lineId, originNode, targetNode, rotate, width, x, y) {
    return'<div ' +
        'id="' + id + '" ' +
        'data-line-id="' + lineId + '" ' +
        'data-origin-node-id="' + (originNode ?? 'null') + '" ' +
        'data-target-node-id="' + (targetNode ?? 'null') + '" ' +
        'class="edge new-edge" style="' +
        'width: ' + width + 'px; ' +
        'height: ' + edgeSize + 'px;' +
        'transform: ' + rotate + ';' +
        'background-color: ' + lineId + ';' +
        'transform-origin: top left; ' +
        'left: ' + x + 'px;' +
        'top: ' + y + 'px" ' +
        '></div>';
}

function updateNodeGrowStyle(node, nodeConnections) {
    let grow = (nodeConnections.length - 1) * 5;
    let finalGrow = grow/5;

    if (finalGrow >= 6) {
        node.classList.add('big-node');
    } else {
        node.classList.remove('big-node');
    }
}

function createTempEdgeElement(originPosition, targetPosition, lineId) {
    let edge = calculateEdgeBetween(originPosition, targetPosition);
    let length = edge.length;
    let angle = edge.angle;

    return'<div ' +
        'data-line-id="' + lineId + '" ' +
        'class="edge temporal-edge" style="' +
        'width: ' + length.toString() + 'px; ' +
        'height: ' + edgeSize + 'px;' +
        'transform: rotate(' + angle.toString() + 'rad);' +
        'background-color: ' + lineId + ';' +
        'transform-origin: top left; ' +
        'left: ' + originPosition.x + 'px;' +
        'top: ' + originPosition.y + 'px" ' +
        '></div>';
}


function createEdgeElement(originNode, targetNode, lineId) {

    let originNodePosition = originNode.getBoundingClientRect();
    let targetNodePosition = targetNode.getBoundingClientRect();

    let originPosition = {
        x: originNodePosition.left + originNodePosition.width/2 + 5,
        y: originNodePosition.top + originNodePosition.width/2
    };

    let targetPosition = {
        x: targetNodePosition.left + targetNodePosition.width/2 + 5,
        y: targetNodePosition.top + targetNodePosition.width/2
    }

    let edge = calculateEdgeBetween(originPosition, targetPosition);
    let length = edge.length;
    let angle = edge.angle;

    return'<div ' +
        'id="edge_' + generateIdString() + '" ' +
        'class="edge new-edge" style="' +
        'width: ' + length.toString() + 'px; ' +
        'height: ' + edgeSize + 'px;' +
        'transform: rotate(' + angle.toString() + 'rad);' +
        'transform-origin: top left; ' +
        'background-color: ' + lineId + ';' +
        'left: ' + originPosition.x + 'px;' +
        'top: ' + originPosition.y + 'px" ' +
        'data-line-id="' + lineId + '" ' +
        'data-origin-node-id="' + (originNode.id ?? 'null') + '" ' +
        'data-target-node-id="' + (targetNode.id ?? 'null') + '" ' +
        '></div>';
}

function refreshNodesBehavior() {
    document.querySelectorAll('.node.new-node').forEach(function(node) {

        // Remove it from dom when click on it
        node.addEventListener('click', function(e) {
            if (e.target.classList.contains('node-title')) {
                return;
            }

            this.classList.add('node-deleted');
            node.remove();
            document.dispatchEvent(new CustomEvent('nodeWasDeleted', {detail: {nodeId: node.id}}))
        });

        node.classList.remove('new-node');
    });
}

function refreshEdgeBehavior() {

    document.querySelectorAll('.edge.new-edge').forEach(function(edge) {

        edge.addEventListener('click', function() {
            dispatchEvent('edgeWasDeleted', {edge: edge});
        })

        edge.classList.remove('new-edge');
    });

    removeTemporalEdgeIfExists();
}

function generateIdString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let idArray = '';

    for (let i = 0; i < 16; i++) {
        idArray += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return idArray;
}

function getCurrentNodeColors(node) {
    let targetId = node.id;
    let colors = [];

    document.querySelectorAll('.edge[data-origin-node-id="' + targetId + '"]').forEach(function (edge) {
        let color = edge.getAttribute('data-line-id');
        if (colors.indexOf(color) === -1) {colors.push(color)}
    })

    document.querySelectorAll('.edge[data-target-node-id="' + targetId + '"]').forEach(function (edge) {
        let color = edge.getAttribute('data-line-id');
        if (colors.indexOf(color) === -1) {colors.push(color)}
    })

    return colors;
}

function getIsColorInUse(currentLineColor) {
    return document.querySelectorAll('.edge[data-line-id="' + currentLineColor + '"]').length > 1;
}

function getLineIdOnNode(nodeOrigin) {
    let targetId = nodeOrigin.id;
    let fromNode = document.querySelector('.edge[data-origin-node-id="' + targetId + '"]') ?? null;

    if (fromNode) {
        return fromNode.getAttribute('data-line-id');
    }

    let toNode = document.querySelector('.edge[data-target-node-id="' + targetId + '"]') ?? null;

    if (toNode) {
        return toNode.getAttribute('data-line-id');
    }

    return null;
}

function getCountedConnectionsOnNode(target) {
    let targetId = target.id;
    let fromNode = document.querySelectorAll(
        '.edge[data-origin-node-id="' + targetId + '"]').length;

    let toNode = document.querySelectorAll(
        '.edge[data-target-node-id="' + targetId + '"]').length;

    return fromNode + toNode;
}

function getLineConnectionsToNode(target, currentLineColor) {
    let targetId = target.id;
    let fromNode = document.querySelectorAll(
        '.edge[data-line-id="' + currentLineColor + '"][data-origin-node-id="' + targetId + '"]').length;

    let toNode = document.querySelectorAll(
        '.edge[data-line-id="' + currentLineColor + '"][data-target-node-id="' + targetId + '"]').length;

    return fromNode + toNode;
}

function roundToValidPosition(number, approximation) {
    return number - (number % approximation);
}

function existsEdgeBetweenNodes(a, b) {
    let nodeOneId = a.id;
    let nodeTwoId = b.id;

    let existsAtoB = document.querySelectorAll(
        '[data-origin-node-id="' + nodeOneId + '"]' +
        '[data-target-node-id="' + nodeTwoId + '"]').length > 0;

    let existsBtoA = document.querySelectorAll(
        '[data-origin-node-id="' + nodeTwoId + '"]' +
        '[data-target-node-id="' + nodeOneId + '"]').length > 0;

    return (existsAtoB || existsBtoA);
}

function getEdgeBetweenNodes(a, b, lineId) {
    let nodeOneId = a;
    let nodeTwoId = b;

    lineId = (lineId !== null) ? '[data-line-id="' + lineId + '"]' : '';

    let existsAtoB = document.querySelector(
        '[data-origin-node-id="' + nodeOneId + '"]' +
        '[data-target-node-id="' + nodeTwoId + '"]' + lineId) ?? null;

    if (existsAtoB !== null) {
        return existsAtoB.id;
    }

    let existsBtoA = document.querySelector(
        '[data-origin-node-id="' + nodeTwoId + '"]' +
        '[data-target-node-id="' + nodeOneId + '"]' + lineId) ?? null;

    if (existsBtoA !== null) {
        return existsBtoA.id;
    }

    return null;
}

function existsSameLineEdgeBetweenNodes(a, b, lineId) {
    let nodeOneId = a.id;
    let nodeTwoId = b.id;

    let existsAtoB = document.querySelectorAll(
        '.edge[data-line-id="' + lineId + '"]' +
        '[data-origin-node-id="' + nodeOneId + '"]' +
        '[data-target-node-id="' + nodeTwoId + '"]').length > 0;

    let existsBtoA = document.querySelectorAll(
        '.edge[data-line-id="' + lineId + '"]' +
        '[data-origin-node-id="' + nodeTwoId + '"]' +
        '[data-target-node-id="' + nodeOneId + '"]').length > 0;

    return (existsAtoB || existsBtoA);
}

function removeTemporalEdgeIfExists() {
    let tempEdge = document.querySelector('.edge.temporal-edge') ?? null;
    if (!tempEdge) {
        return false;
    }

    tempEdge.remove();

    return true;
}

function calculateEdgeBetween(originPosition, targetPosition) {
    return {
        length: Math.sqrt(Math.pow(targetPosition.x - originPosition.x, 2) + Math.pow(targetPosition.y - originPosition.y, 2)),
        angle: Math.atan2(targetPosition.y - originPosition.y, targetPosition.x - originPosition.x)
    };
}

function updateEdgePositions(temporalEdge, originPosition, targetPosition, validEdge) {

    if (!temporalEdge || typeof temporalEdge === 'undefined') {
        return;
    }

    let edge = calculateEdgeBetween(originPosition, targetPosition);
    let length = edge.length;
    let angle = edge.angle;

    temporalEdge.style.width = length.toString() + 'px';
    temporalEdge.style.transform = 'rotate(' + angle.toString() + 'rad)';
    temporalEdge.style.left = originPosition.x + 'px';
    temporalEdge.style.top = originPosition.y + 'px';

    if (validEdge) {
        temporalEdge.classList.remove('invalid-edge');
    } else {
        temporalEdge.classList.add('invalid-edge');
    }
}

function createPlacementCursor(position, size) {

    return'<div ' +
        'class="placement-helper hidden" style="' +
        'width: ' + size + 'px; ' +
        'height: ' + size + 'px;' +
        'left: ' + position.x + 'px;' +
        'top: ' + position.y + 'px" ' +
        '></div>';
}

function updatePlacementCursorCoordinates(validPlacementCursor, coordinates, approximation) {
    validPlacementCursor.style.left = roundToValidPosition(coordinates.x, approximation) + 'px';
    validPlacementCursor.style.top = roundToValidPosition(coordinates.y, approximation) + 'px';
}

function showElement(element) {
    if (element !== null && typeof  element !== 'undefined') {
        element.style.display = 'block';
    }
}

function hideElement(element) {
    if (element !== null && typeof  element !== 'undefined') {
        element.style.display = 'none';
    }
}

function createRiverParts(screenWidth, screenHeight) {
    let padding = 50;
    let startX = -padding;
    let startY = -padding;
    let endX = null;
    let endY = null;

    // toggle between top-down (0) || left-right (1)
    let direction = random(DIRECTION_TOP_BOTTOM, DIRECTION_LEFT_RIGHT);

    if (direction === DIRECTION_TOP_BOTTOM) {
        startX = random(padding, screenWidth - padding);
    } else {
        startY = random(padding, screenHeight - padding);
    }

    let items = [];
    let maxPieces = 1;//random(1, 2);

    for (let i = maxPieces; i >= 1; i--) {
        if (direction === DIRECTION_TOP_BOTTOM) {
            endX = random(padding, screenHeight - padding);
            endY = screenHeight/i;

            if (i === 1) {
                endY += nodeSize*2;
            }

        } else {
            endX = screenWidth/i;
            endY = random(padding, screenWidth - padding);

            if (i === 1) {
                endX += nodeSize*2
            }
        }

        console.log(direction === 0 ? 'top->down' : 'left->right', {startX, startY}, {endX, endY});

        if (items.length > 0) {
            if (direction === DIRECTION_TOP_BOTTOM) {
                startY-=riverSize/2;

            } else {
                startX-=riverSize/2;
            }
        }
        items.push(createHtmlRiver({x: startX, y: startY}, {x: endX, y: endY}), false);

        startX = endX;
        startY = endY;
    }

    return items;
}

function createHtmlRiver(originPosition, targetPosition, temporal) {
    let river = calculateEdgeBetween(originPosition, targetPosition);
    let length = river.length;
    let angle = river.angle;

    let className = (temporal === true) ? 'river-edge temporal-river-edge' : 'river-edge';

    return'<div ' +
        'class="' + className + '" style="' +
        'border-radius: ' + riverSize + 'px; ' +
        'width: ' + length.toString() + 'px; ' +
        'height: ' + riverSize + 'px;' +
        'transform: rotate(' + angle.toString() + 'rad);' +
        'transform-origin: top left; ' +
        'left: ' + originPosition.x + 'px;' +
        'top: ' + originPosition.y + 'px" ' +
        '></div>';
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}
