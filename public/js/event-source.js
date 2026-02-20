export function fetchData(route, { onData, onDone, onError }) {
    const eventSource = new EventSource(route);
    eventSource.addEventListener('message', onData);
    eventSource.addEventListener('close', () => ( eventSource.close(), onDone() ));
    eventSource.addEventListener('error', onError);
}

export function resolveData(processItem) {
    return event => processItem(JSON.parse(event.data));
}
