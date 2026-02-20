export function fetchData(route, { accept, onData, onDone, onError }) {
    fetch(route, { method: 'POST', headers: { accept } })
        .then(checkErrors)
        .then(onData)
        .then(onDone)
        .catch(onError);
}

function checkErrors(response) {
    if (response.status === 200) return response;
    console.log('bad response from server');
    throw Error('Bad response');
}
