export function resolveData(processItem) {
    return processResponse.bind(null, processItem);
}

async function processResponse(handleItem, response) {
    const { data } = await response.json();
    data.forEach(handleItem);
}
