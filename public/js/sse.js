export async function processResponse(handleStreamItem, response) {
    const utf8Decoder = new TextDecoder("utf-8");
    const reader = response.body.getReader();

    let buffer = '';
    for (;;) {
        // read from the stream
        const { value, done } = await reader.read();

        // check if the stream is done (server closed connection)
        if (done) {
            // TODO: what if there is still data in the buffer? Is that possible?

            console.log('stream is done');
            // end the loop, there is no more data
            break;
        }

        // append latest stream data to the buffer
        buffer += value ? utf8Decoder.decode(value, { stream: true }) : '';

        // split the buffer into lines
        const lines = buffer.split('\n');

        // attempt to process each line
        for (let possibleLine of lines.slice(0, -1)) {
            const line = possibleLine.trim();

            if (line) {
                try {
                    handleStreamItem(JSON.parse(line));
                } catch (error) {
                    console.log('line is not json', line);
                }
            }
        }

        // set the buffer to remaining data from the chunk
        buffer = lines.at(-1);
    }
}
