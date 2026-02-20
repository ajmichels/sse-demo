export const MODE = new Map([
    [
        'json',
        { accept: 'application/json', fetcher: 'fetch.js', resolver: 'json.js' },
    ],
    [
        'jsonl-stream',
        { accept: 'application/jsonl', fetcher: 'fetch.js', resolver: 'jsonl-stream.js' },
    ],
    [
        'event-stream',
        { accept: 'text/event-stream', fetcher: 'event-source.js', resolver: 'event-source.js' },
    ],
]);

export async function runSolution(document, mode, msg, list) {
    const { accept, fetcher, resolver } = MODE.get(mode);
    const { fetchData } = await import(`/js/${fetcher}`);
    const { resolveData } = await import(`/js/${resolver}`);

    msg.style.display = 'block';
    fetchData('/data', {
        accept,
        onData: resolveData(processItem.bind(null, document, list)),
        onError: handleErrors.bind(null, msg),
        onDone: updateMessage.bind(null, msg, 'Data finished loading!'),
    });
}

export function buildUI(document, mode) {
    const select = document.querySelector('select[name=mode]');
    MODE.forEach((_, key) => {
        const option = document.createElement('option');
        option.value = key;
        option.innerText = key;
        option.selected = mode === key;
        select.appendChild(option);
    });

    const msg = document.getElementById('msg');

    const list = document.createElement('ul');
    document.getElementById('target').appendChild(list);

    return { msg, list };
}

function processItem(document, list, { message }) {
    const item = document.createElement('li');
    item.innerText = message;
    list.appendChild(item);
}

function handleErrors(msg, error) {
    console.error('fetch error', error)
    updateMessage(msg, 'Request error!');
}

function updateMessage(msg, message) {
    msg.innerText = message;
}
