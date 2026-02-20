import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';

const app = express();
const contentTypes = new Map([
    ['application/json', json],
    ['application/jsonl', jsonl],
    ['text/event-stream', eventStream],
]);

// Some request logging
app.use((req, res, next) => {
    const startTime = Date.now();
    req.startTime = startTime;
    console.log('request start', req.path);
    res.on('close', () => console.log('request end', req.path, Date.now() - startTime));
    next();
});

// Serve static files
app.use(express.static(resolve(join(import.meta.dirname, '../public'))));

// Ensure CORS is not a problem
app.use((req, res, next) => {
    res.set('access-control-allow-origin', '*');
    next();
});

app.get('/data', checkAcceptance, dataHandler);
app.post('/data', checkAcceptance, dataHandler);

const port = process.env.PORT || 3000;
app.listen(port, err => {
    if (err) return console.error('error starting server', err);
    console.log('listening for requests', port);
});

function checkAcceptance(req, res, next) {
    const acceptable = req.get('accept')?.split(',')
        .map(s => s.split(';').at(0).trim()); // strip parameters (for now)

    console.log('acceptable content types', acceptable);

    // default to JSON
    if (!acceptable || acceptable.at(0) === '*/*') {
        req.targetContentType = 'application/json';
        return next();
    }

    // find first matching content type
    const available = Array.from(contentTypes.keys());
    for (const type of acceptable) {
        if (available.includes(type)) {
            req.targetContentType = type;
            return next();
        }

        // TODO: add support for wildcard types
    }

    return res.status(406).send();
}

async function dataHandler(req, res) {
    const responseWithContent = contentTypes.get(req.targetContentType);
    responseWithContent(req, res);
}

function createDelayedActions(cb, initialMessage) {
    return [
        delayedAction(    0, cb.bind(null, { id: randomUUID(), event: 'message', message: initialMessage })),
        delayedAction(  100, cb.bind(null, { id: randomUUID(), event: 'message', message: '100ms has passed' })),
        delayedAction(  200, cb.bind(null, { id: randomUUID(), event: 'message', message: '200ms has passed' })),
        delayedAction(  400, cb.bind(null, { id: randomUUID(), event: 'message', message: '400ms has passed' })),
        delayedAction(  800, cb.bind(null, { id: randomUUID(), event: 'message', message: '800ms has passed' })),
        delayedAction( 1600, cb.bind(null, { id: randomUUID(), event: 'message', message: '1600ms has passed' })),
        delayedAction( 3200, cb.bind(null, { id: randomUUID(), event: 'message', message: '3200ms has passed' })),
        delayedAction( 6400, cb.bind(null, { id: randomUUID(), event: 'message', message: '6400ms has passed' })),
        delayedAction(12800, cb.bind(null, { id: randomUUID(), event: 'message', message: '12800ms has passed' })),
    ];
}

function delayedAction(ms, cb) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => {
                try {
                    resolve(cb())
                } catch (error) {
                    reject(error);
                }
            }, ms);
        } catch (error) {
            reject(error);
        }
    });
}

async function json(req, res) {
    const body = { data: [] };
    const writeJSON = input => body.data.push(input);

    // wait for random data over time
    // return all data as JSON
    await Promise.all(createDelayedActions(writeJSON, 'hello, world, the rest response is here'));

    res.set('content-type', 'application/json');
    console.log('request starting response', req.path, Date.now() - req.startTime);
    res.json(body);
}

function eventStream(req, res) {
    const writeJSON = ({ id, event, ...data }) => res.write(`id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // return an event stream
    res.set('content-type', 'text/event-stream');

    // return random data over time as events
    const actions = createDelayedActions(writeJSON, 'hello world, the event stream has started');

    actions.at(0).then(() => {
        console.log('request first bytes sent', req.path, Date.now() - req.startTime);
    });

    // close the connection after last action is done
    actions.at(-1).then(() => {
        writeJSON({id: randomUUID(), event: 'close', message: 'Goodbye!' });
        res.end();
    });
}

function jsonl(req, res) {
    const writeJSON = input => res.write(JSON.stringify(input) + '\n');

    // return an event stream
    res.set('content-type', 'application/jsonl');

    // return random data over time as events
    const actions = createDelayedActions(writeJSON, 'hello world, the jsonl stream has started');

    actions.at(0).then(() => {
        console.log('request first bytes sent', req.path, Date.now() - req.startTime);
    });

    // close the connection after last action is done
    actions.at(-1).then(() => res.end());
}
