export async function processResponse(handleItem, response) {
    const { data } = await response.json();
    data.forEach(handleItem);
}
