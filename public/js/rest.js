export function execute(route, { onMessage, onDone, onError }) {
    fetch(route, { method: 'POST' })
        .then(checkErrors)
        .then(processResponse.bind(null, onMessage))
        .then(onDone)
        .catch(onError);
}

function checkErrors(response) {
    if (response.status === 200) return response;
    console.log('bad response from server');
    throw Error('Bad response');
}

async function processResponse(handleItem, response) {
    const { data } = await response.json();
    data.forEach(handleItem);
}
