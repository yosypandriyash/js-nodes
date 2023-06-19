const riverSize = 100;
const nodeSize = 40;
const edgeSize = nodeSize/3;
const DIRECTION_TOP_BOTTOM = 0;
const DIRECTION_LEFT_RIGHT = 1;
const appWrapper = document.querySelector('.app-wrapper');

let currentLineColor = null;
let mapIsInRouteCalculateMode = false;
let mapIsInRouteCalculateModeOrigin = null;
let mapIsInRouteCalculateModeTarget = null;

document.addEventListener("DOMContentLoaded", function() {

    console.log('Usa el metodo en consola minorNodes(origen, destino) para mostrar la ruta más rápida entre dos nodos');
    console.log('Recuerda que puedes cambiar el nombre de los nodos...');
    console.log('Usa el método __ok() para resetear la pantalla')

    importDataFromLocalStorage(appWrapper);

    let showingLine = false;
    let validPlacementCursor = null;
    let originPress = {x: null, y: null};
    let nodeOrigin = null;
    let nodeTarget = null;
    let creatingEdge = false;
    let temporalEdge = null;
    let validCurrentEdge = null;
    let tippingTitleNode = null;

    document.addEventListener('keydown', function(e) {
        if (tippingTitleNode !== null && (e.key === 'Enter' || e.key === 'Escape')) {
            e.preventDefault();
            let title = e.target.innerText.toLowerCase();
            e.target.setAttribute('contenteditable', false);
            e.target.closest('.node').setAttribute('data-title', title);
            tippingTitleNode = null;

            dispatchEvent('mapWasChange', {});
        }
    })

    document.getElementById('delete-btn').addEventListener('click', function(e) {
        document.querySelectorAll('.node:not(.node-deleted)').forEach(function(node) {node.remove()})
        document.querySelectorAll('.edge:not(.temporal-edge)').forEach(function(edge) {edge.remove()})
        dispatchEvent('mapWasChange', {});
    })

    document.addEventListener('selectedLineWasChange', function (e) {
        let lastColor = currentLineColor;
        currentLineColor = e.detail.lineId ?? null;

        if (lastColor === currentLineColor) {

            if (showingLine) {
                showingLine = false;
                document.querySelectorAll('.edge').forEach(function(element) {
                    element.classList.remove('opacity-10');
                });

                document.querySelectorAll('.node').forEach(function(node) {
                    node.classList.remove('opacity-10');
                })

                return;
            }

            // toggle class lineOpacity
            let connectedNodes = [];
            showingLine = true;
            document.querySelectorAll('.edge').forEach(function(element) {
                element.classList.add('opacity-10');
                if (element.getAttribute('data-line-id') === currentLineColor) {
                    element.classList.remove('opacity-10');
                    connectedNodes.push(element.getAttribute('data-origin-node-id'));
                    connectedNodes.push(element.getAttribute('data-target-node-id'));
                }
            });

            document.querySelectorAll('.node').forEach(function(node) {
                node.classList.add('opacity-10');
                if (connectedNodes.indexOf(node.id) !== -1) {
                    node.classList.remove('opacity-10');
                }
            })

            return;
        }

        let element = document.querySelector('.color[data-color-value].selected') ?? null;

        if (!element) {
            element = document.querySelector('.color[data-color-value]');
            element.classList.add('selected');
            return;
        }

        element.classList.remove('selected');
        document.querySelector('.color[data-color-value="' + currentLineColor + '"]').classList.add('selected');
    })

    // Initialize options layout
    document.querySelectorAll('.color[data-color-value]').forEach(function(element) {
        element.style.backgroundColor = element.getAttribute('data-color-value');

        element.addEventListener('click', function() {
            dispatchEvent('selectedLineWasChange', {lineId: element.getAttribute('data-color-value')});
        })

        if (!currentLineColor) {
            dispatchEvent('selectedLineWasChange', {lineId: element.getAttribute('data-color-value')});
        }
    })


    appWrapper.addEventListener('mousedown', function (e) {

        e.preventDefault();
        originPress.x = e.clientX - nodeSize/2;
        originPress.y = e.clientY - nodeSize/2;

        if (e.target.classList.contains('node')) {
            nodeOrigin = e.target;
        }
    })

    appWrapper.addEventListener('mousemove', function (e) {

        let currentX = e.clientX;
        let currentY = e.clientY;

        let originalNodeWasDeleted = nodeOrigin !== null && nodeOrigin.classList.contains('node-deleted');
        creatingEdge = (!originalNodeWasDeleted && nodeOrigin !== null && (currentX !== originPress.x || currentY !== originPress.y));

        if (!creatingEdge) {
            if (validPlacementCursor === null) {
                appWrapper.insertAdjacentHTML('beforeend', createPlacementCursor({x: currentX, y: currentY}, nodeSize));
                validPlacementCursor = document.querySelector('.placement-helper');
            }

            if (e.target.classList.contains('river-edge')) {
                hideElement(validPlacementCursor);
            } else {
                updatePlacementCursorCoordinates(validPlacementCursor, {x: currentX, y: currentY}, nodeSize);
                showElement(validPlacementCursor);
            }
        }

        if (creatingEdge) {

            hideElement(validPlacementCursor);
            validCurrentEdge = getLineConnectionsToNode(nodeOrigin, currentLineColor) < 2;

            // if color is in use, just can continue using it from terminal node that using this color
            let colorInUse = getIsColorInUse(currentLineColor);
            let currentNodeColors = getCurrentNodeColors(nodeOrigin);

            if (colorInUse && currentNodeColors.indexOf(currentLineColor) === -1) {
                validCurrentEdge = false;
            }

            if (getCountedConnectionsOnNode(nodeOrigin) === 1 && colorInUse && currentNodeColors.indexOf(currentLineColor) === -1) {
                document.dispatchEvent(new CustomEvent('selectedLineWasChange', {detail:
                        {lineId: getLineIdOnNode(nodeOrigin)}
                }));
            }

            if (!temporalEdge) {
                appWrapper.insertAdjacentHTML('beforeend',
                    createTempEdgeElement({
                        x: originPress.x + nodeSize/2 + 5,
                        y: originPress.y + nodeSize/2
                    }, {
                        x: currentX,
                        y: currentY
                    }, currentLineColor)
                );

                temporalEdge = document.querySelector('.edge.temporal-edge');
            }

            updateEdgePositions(temporalEdge, {
                x: originPress.x + nodeSize/2 + 5,
                y: originPress.y + nodeSize/2
            }, {
                x: currentX + 5,
                y: currentY + 5
            }, validCurrentEdge);

        } else if (temporalEdge !== null) {
            removeTemporalEdgeIfExists() && (temporalEdge = null);
        }
    })

    appWrapper.addEventListener('mouseup', function (e) {
        // check same position
        e.preventDefault();

        let finalX = e.clientX - nodeSize/2;
        let finalY = e.clientY - nodeSize/2;

        if (temporalEdge !== null) {
            removeTemporalEdgeIfExists() && (temporalEdge = null);
        }

        if (e.target.classList.contains('node-title')) {
            tippingTitleNode = e.target;

            e.target.setAttribute('contenteditable', true);
            e.target.focus();
            window.getSelection().selectAllChildren(e.target);

            e.stopPropagation();
            return;
        }

        if (e.target.classList.contains('node')) {
            nodeTarget = e.target;

            if (nodeTarget !== null && nodeOrigin !== null && nodeTarget.id !== nodeOrigin.id) {

                // check if reverse edge exists
                let valid = getLineConnectionsToNode(nodeTarget, currentLineColor) < 2;
                if (valid && validCurrentEdge === true && !existsSameLineEdgeBetweenNodes(nodeOrigin, nodeTarget, currentLineColor)) {
                    appWrapper.insertAdjacentHTML('beforeend', createEdgeElement(nodeOrigin, nodeTarget, currentLineColor));

                    dispatchEvent('edgeWasCreated', {
                        edge: document.querySelector(
                            '.edge[data-line-id="' + currentLineColor + '"][data-origin-node-id="' + nodeOrigin.id + '"][data-target-node-id="' + nodeTarget.id + '"]')
                    });
                }

                // check if another edge exists between this two points
                // if (existsEdgeBetweenNodes(nodeOrigin, nodeTarget)) {
                //     // replace by multicolor line
                // }
            }
        }

        if ((originPress.x === finalX) && (originPress.y === finalY)) {

            if (e.target.classList.contains('node')) {
                return;
            }

            if (e.target.classList.contains('edge')) {
                return;
            }

            if (e.target.classList.contains('river-edge')) {
                return;
            }

            finalX = roundToValidPosition(finalX + nodeSize/2, nodeSize);
            finalY = roundToValidPosition(finalY + nodeSize/2, nodeSize);
            let quadrantX = (finalX + nodeSize)/nodeSize;
            let quadrantY = (finalY + nodeSize)/nodeSize;

            let node = createNodeElement(finalX, finalY, quadrantX, quadrantY);
            appWrapper.insertAdjacentHTML('beforeend', node);
            dispatchEvent('nodeWasCreated', {node: node});
        }

        nodeOrigin = null;
        nodeTarget = null;
        creatingEdge = false;
        validCurrentEdge = null;

        refreshNodesBehavior();
        refreshEdgeBehavior();
    });

    document.addEventListener('mapWasChange', function() {
        saveDataToLocalStorage();

        if (mapIsInRouteCalculateMode === true && mapIsInRouteCalculateModeOrigin !== null && mapIsInRouteCalculateModeTarget !== null) {
            minorNodes(mapIsInRouteCalculateModeOrigin, mapIsInRouteCalculateModeTarget);
        }
    })

    document.addEventListener('nodeWasDeleted', function(e) {

        // Remove associated edges
        let deletedNodeId = e.detail.nodeId ?? null;
        document.querySelectorAll('.edge[data-origin-node-id="' + deletedNodeId + '"]').forEach(function(edge) {
            dispatchEvent('edgeWasDeleted', {edge: edge});
        })

        document.querySelectorAll('.edge[data-target-node-id="' + deletedNodeId + '"]').forEach(function(edge) {
            dispatchEvent('edgeWasDeleted', {edge: edge});
        })

        dispatchEvent('mapWasChange', {});
    })

    document.addEventListener('edgeWasCreated', function(e) {
        let edge = e.detail.edge ?? null;

        let sourceNodeId = edge.getAttribute('data-origin-node-id');
        let targetNodeId = edge.getAttribute('data-target-node-id');

        let sourceNode = document.querySelector('.node[id="' + sourceNodeId + '"]') ?? null;
        let targetNode = document.querySelector('.node[id="' + targetNodeId + '"]') ?? null;

        if (sourceNode !== null && targetNode !== null) {
            dispatchEvent('nodeWasConnected', {node: sourceNode, connectedTo: targetNode});
            dispatchEvent('nodeWasConnected', {node: targetNode, connectedTo: sourceNode});
        }

        dispatchEvent('mapWasChange', {});
    });

    // todo edge nt delete propertly
    // todo on edge delete, node associated nodes not correctly calculated
    // todo on edge remove check if can join two separated nodes by lines

    document.addEventListener('edgeWasDeleted', function(e) {
        let edge = e.detail.edge ?? null;

        if (!edge) {
            return;
        }

        // if exist same line color from targetNode, delete it
        // delete just when line divided in two separated parts
        // check for circular lines
        let lineId = edge.getAttribute('data-line-id');
        let sourceNodeId = edge.getAttribute('data-origin-node-id');
        let targetNodeId = edge.getAttribute('data-target-node-id');

        let sourceNode = document.querySelector('.node[id="' + sourceNodeId + '"]') ?? null;
        let targetNode = document.querySelector('.node[id="' + targetNodeId + '"]') ?? null;

        if (sourceNode !== null && targetNode !== null) {
            dispatchEvent('nodeWasDisconnected', {node: sourceNode, disconnectedFrom: targetNode});
            dispatchEvent('nodeWasDisconnected', {node: targetNode, disconnectedFrom: sourceNode});
        }

        if (isCircularLine(lineId, sourceNodeId)) {
            edge.remove();
            dispatchEvent('mapWasChange', {});
            return;
        }

        let sameLineEdgeToSourceNode = document.querySelector('.edge[data-line-id="' + lineId + '"][data-target-node-id="' + sourceNodeId + '"]') ?? null;

        if (sameLineEdgeToSourceNode !== null) {
            let sameLineEdgeFromTarget = document.querySelector('.edge[data-line-id="' + lineId + '"][data-origin-node-id="' + targetNodeId + '"]') ?? null;
            if (sameLineEdgeFromTarget !== null) {
                dispatchEvent('edgeWasDeleted', {edge: sameLineEdgeFromTarget});
            }
        }

        dispatchEvent('mapWasChange', {});
        edge.remove();
    })

    document.addEventListener('nodeWasCreated', function(e) {
        dispatchEvent('mapWasChange', {});
    })

    document.addEventListener('nodeWasConnected', function(e) {
        let node = e.detail.node;
        let connectedTo = e.detail.connectedTo;

        let nodeConnections = node.getAttribute('data-connected-nodes')
            .replace('[', '')
            .replace(']', '')
            .split(',');

        nodeConnections.push(connectedTo.id);
        node.setAttribute('data-connected-nodes', '[' + nodeConnections.join(',') + ']');

        updateNodeGrowStyle(node, nodeConnections);
        dispatchEvent('mapWasChange', {});

    })

    document.addEventListener('nodeWasDisconnected', function(e) {
        let node = e.detail.node;
        let disconnectedFrom = e.detail.disconnectedFrom;

        let nodeConnections = node.getAttribute('data-connected-nodes')
            .replace('[', '')
            .replace(']', '')
            .split(',');

        let position = nodeConnections.indexOf(disconnectedFrom.id);
        if (position !== -1) {
            nodeConnections.splice(position, 1);
        }

        node.setAttribute('data-connected-nodes', '[' + nodeConnections.join(',') + ']');
        updateNodeGrowStyle(node, nodeConnections);
        dispatchEvent('mapWasChange', {});
    })
});