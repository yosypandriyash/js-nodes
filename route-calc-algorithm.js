
function minorNodes(originName, targetName) {

    mapIsInRouteCalculateMode = true;
    mapIsInRouteCalculateModeOrigin = originName;
    mapIsInRouteCalculateModeTarget = targetName;

    let origin = document.querySelector('.node[data-title="' + originName.toLowerCase() + '"]') ?? null;
    let target = document.querySelector('.node[data-title="' + targetName.toLowerCase() + '"]') ?? null;

    if (!origin || !target) {
        return;
    }

    let targetId = target.id;
    let nodesMap = {};
    let distance = 0;

    document.querySelectorAll('.node:not(.node-deleted)').forEach(function (node) {
        nodesMap[node.id] = {distance: Infinity, prev: null}
    })

    nodesMap[origin.id] = {distance: distance, prev: origin.id};
    nodesMap = __calculateNodesDistancesMap(origin.id, nodesMap);

    let routeNodes = getFastestRoute(nodesMap, origin.id, targetId);
    let routeEdges = getFastestRouteEdges(routeNodes);
    let routeParts = routeNodes.concat(routeEdges);

    document.querySelectorAll('.edge').forEach(function(element) {
        if (routeParts.indexOf(element.id) !== -1) {
            element.classList.remove('opacity-10');
        } else {
            element.classList.add('opacity-10');
        }

    });

    document.querySelectorAll('.node').forEach(function(node) {
        if (routeParts.indexOf(node.id) !== -1) {
            node.classList.remove('opacity-10');
        } else {
            node.classList.add('opacity-10');
        }

    })
}

function __ok() {

    mapIsInRouteCalculateMode = false;

    document.querySelectorAll('.edge').forEach(function(element) {
        element.classList.remove('opacity-10');
    });

    document.querySelectorAll('.node').forEach(function(node) {
        node.classList.remove('opacity-10');
    })
}

function getFastestRouteEdges(routeNodes) {
    let result = [];
    let currentLine = null;
    let edge = null;

    for (let i = 0; i < routeNodes.length; i++) {
        let currentNode = routeNodes[i];
        if ((i + 1) < routeNodes.length) {

            let nextNode = routeNodes[i+1];
            if (currentLine !== null) {
                edge = getEdgeBetweenNodes(currentNode, nextNode);
                currentLine = edge.getAttribute('data-line-id');

            } else {
                edge = getEdgeBetweenNodes(currentNode, nextNode, currentLine);
                if (!edge) {
                    edge = getEdgeBetweenNodes(currentNode, nextNode);
                    if (!edge) {
                        return [];
                    }
                    currentLine = edge.getAttribute('data-line-id');
                }
            }

            result.push(edge);
        }
    }

    return result;
}

function getFastestRoute(nodesMap, originId, destinyId) {
    let route = [destinyId];

    let prev = null;
    let current = destinyId;

    while (prev !== originId) {
        prev = nodesMap[current].prev;
        current = prev;
        route.push(current);
    }

    return route.reverse();
}

function __calculateNodesDistancesMap(id, nodesMap) {

    let queue = new Queue();
    queue.enqueue(id);

    while(!queue.isEmpty()) {
        let source = queue.dequeue();

        if (!nodesMap[source]) {
            queue.dequeue(source);
            continue;
        }

        let distance = nodesMap[source].distance;
        let neighbours = __getNodeNeighboursIds(__getElement(source));

        neighbours.forEach(function(elementId) {

            let neighbourDistance = nodesMap[elementId].distance;
            if (neighbourDistance === Infinity) {
                nodesMap[elementId].distance = distance + 1;
                nodesMap[elementId].prev = source;
                queue.enqueue(elementId);
            }
        })
    }

    return nodesMap;
}

function __getElement(id) {
    return document.querySelector('.node[id="' + id + '"]') ?? null;
}

function __getNodeNeighboursIds(node) {
    return node.getAttribute('data-connected-nodes')
        .replace('[', '')
        .replace(']', '')
        .split(',')
        .filter(function(value) {
            return value.trim().length > 0
        }).map(function(element) {
            return element.trim();
        });
}