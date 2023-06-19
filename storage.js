function importDataFromLocalStorage(container) {
    if (window.localStorage.getItem('map-data') === null) {
        window.localStorage.setItem('map-data', '');
        return false;
    }

    try {
        let structure = JSON.parse(window.localStorage.getItem('map-data'));
        if (structure.nodes.length > 0) {
            structure.nodes.forEach(function(node) {
                container.insertAdjacentHTML('beforeend', createBaseNodeHtmlElement(
                    node.id,
                    node.title,
                    node.y,
                    node.x,
                    node.quadrantX,
                    node.quadrantY,
                    node.connectedNodes,
                    node.bigNode ? 'big-node' : ''
                ));
            })
        }
        refreshNodesBehavior();

        if (structure.edges.length > 0) {
            structure.edges.forEach(function(edge) {
                container.insertAdjacentHTML('beforeend', createBaseEdgeHtmlElement(
                    edge.id,
                    edge.lineId,
                    edge.originNode,
                    edge.targetNode,
                    edge.rotate,
                    edge.width,
                    edge.x,
                    edge.y
                ));
            })
        }
        refreshEdgeBehavior();

    } catch (Error) {
        window.localStorage.setItem('map-data', '');
    }
}

function saveDataToLocalStorage() {
    let structure = {
        nodes: [],
        edges: []
    };

    document.querySelectorAll('.node:not(.node-deleted)').forEach(function(node) {
        structure.nodes.push({
            id: node.id,
            title: node.getAttribute('data-title'),
            quadrantX: parseInt(node.getAttribute('data-quadrant-x')),
            quadrantY: parseInt(node.getAttribute('data-quadrant-y')),
            connectedNodes: node.getAttribute('data-connected-nodes')
                .replace('[','')
                .replace(']', '')
                .split(','),
            x: parseInt(node.style.left.replace('px', '')),
            y: parseInt(node.style.top.replace('px', '')),
            bigNode: node.classList.contains('big-node')
        });
    });

    document.querySelectorAll('.edge:not(.temporal-edge)').forEach(function(edge) {
        structure.edges.push({
            id: edge.id,
            lineId: edge.getAttribute('data-line-id'),
            originNode: edge.getAttribute('data-origin-node-id'),
            targetNode: edge.getAttribute('data-target-node-id'),
            width: parseInt(edge.style.width.replace('px', '')),
            rotate: edge.style.transform,
            x: parseInt(edge.style.left.replace('px', '')),
            y: parseInt(edge.style.top.replace('px', '')),
        });
    });

    window.localStorage.setItem('map-data', JSON.stringify(structure));
}