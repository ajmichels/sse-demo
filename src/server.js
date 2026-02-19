import { join, resolve } from 'node:path';
import express from 'express';

const app = express();

app.use((req, res, next) => {
    const startTime = Date.now();
    req.startTime = startTime;
    console.log('request start', req.path);
    res.on('close', () => console.log('request end', req.path, Date.now() - startTime));
    next();
});

app.use(express.static(resolve(join(import.meta.dirname, '../public'))));

app.use((req, res, next) => {
    res.set('access-control-allow-origin', '*');
    next();
});

app.post('/sse', (req, res) => {
    const writeJSON = input => res.write(JSON.stringify(input) + '\n');

    // return an event stream
    res.set('content-type', 'text/event-stream');
    writeJSON({message: 'hello world, the stream has started'});
    console.log('request first bytes sent', req.path, Date.now() - req.startTime);

    // return random data over time as events
    const actions = createDelayedActions(writeJSON);

    // close the connection after last action is done
    actions.at(-1).then(() => res.end());
});

app.post('/rest', async (req, res) => {
    const body = { data: [] };
    const writeJSON = input => body.data.push(input);

    // wait for random data over time
    writeJSON({ message: 'hello world, the body has started' });

    // return all data as JSON
    await Promise.all(createDelayedActions(writeJSON));

    res.set('content-type', 'application/json');
    console.log('request starting response', req.path, Date.now() - req.startTime);
    res.json(body);
});

const port = process.env.PORT || 3000;
app.listen(port, err => {
    if (err) return console.error('error starting server', err);
    console.log('listening for requests', port);
});

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

function createDelayedActions(cb) {
    return [
        delayedAction(  100, cb.bind(null, { message: '100ms has passed' })),
        delayedAction(  200, cb.bind(null, { message: '200ms has passed' })),
        delayedAction(  400, cb.bind(null, { message: '400ms has passed' })),
        delayedAction(  800, cb.bind(null, { message: '800ms has passed' })),
        delayedAction( 1600, cb.bind(null, { message: '1600ms has passed' })),
        delayedAction( 3200, cb.bind(null, { message: '3200ms has passed' })),
        delayedAction( 6400, cb.bind(null, { message: '6400ms has passed' })),
        delayedAction(12800, cb.bind(null, { message: '12800ms has passed' })),
    ];
}
