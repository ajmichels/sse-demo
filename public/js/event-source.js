export function execute(route, { onMessage, onDone, onError }) {
    const eventSource = new EventSource(route);
    eventSource.addEventListener('message', event => onMessage(JSON.parse(event.data)));
    eventSource.addEventListener('close', () => ( eventSource.close(), onDone() ));
    eventSource.addEventListener('error', onError);
}
