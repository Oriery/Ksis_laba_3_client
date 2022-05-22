const server_url = 'http://localhost/Ksis_laba_3_server/';

let i_file = document.getElementById("i_file");
let i_urlFrom = document.getElementById("i_urlFrom");
let i_urlTo = document.getElementById("i_urlTo");
let files_list = document.getElementById("files_list");

window.onload = function() {
    document.getElementById("b_put").onclick = () => {
        let file = i_file.files[0];
        if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");

            reader.onload = function(evt) {
                doRequest("PUT", server_url, evt.target.result, "", i_urlTo.value)
                    .then(data => {
                        console.log(data);
                    });
            }

            reader.onerror = function() {
                console.log("Ошибка при чтении файла");
            }
        } else {
            console.log("Файл не выбран");
        }
    }

    document.getElementById("b_post").onclick = () => {
        let file = i_file.files[0];
        if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");

            reader.onload = function(evt) {
                doRequest("POST", server_url, evt.target.result, "", i_urlTo.value)
                    .then(data => {
                        console.log(data);
                    });
            }

            reader.onerror = function() {
                console.log("Ошибка при чтении файла");
            }
        } else {
            console.log("Файл не выбран");
        }
    }

    document.getElementById("b_get").onclick = () => {
        doRequest("GET", server_url, "", i_urlFrom.value)
            .then(response => {
                const reader = response.body.getReader();
                return new ReadableStream({
                    start(controller) {
                        return pump();

                        function pump() {
                            return reader.read().then(({ done, value }) => {
                                // When no more data needs to be consumed, close the stream
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                // Enqueue the next data chunk into our target stream
                                controller.enqueue(value);
                                return pump();
                            });
                        }
                    }
                })
            })
            // Create a new response out of the stream
            .then(stream => new Response(stream))
            // Create an object URL for the response
            .then(response => response.blob())
            .then(blob => download(blob, basename(i_urlFrom.value)))
    }

    document.getElementById("b_delete").onclick = () => {
        doRequest("DELETE", server_url, "", i_urlFrom.value)
            .then(data => {
                console.log(data);
            });
    }

    document.getElementById("b_copy").onclick = () => {
        doRequest("COPY", server_url, "", i_urlFrom.value, i_urlTo.value)
            .then(data => {
                console.log(data);
            });
    }

    document.getElementById("b_move").onclick = () => {
        doRequest("MOVE", server_url, "", i_urlFrom.value, i_urlTo.value)
            .then(data => {
                console.log(data);
            });
    }

    document.getElementById("b_files").onclick = () => {
        doRequest("FILES", server_url)
            .then(response => {
                response.text().then(text => { files_list.innerHTML = text })
            })
    }
}

async function doRequest(methodd, url, data = "", fileFrom = "", fileTo = "") {
    if (fileFrom.length > 0) {
        url += '?fileFrom=' + fileFrom;
        if (fileTo.length > 0) {
            url += '&fileTo=' + fileTo;
        }
    } else {
        if (fileTo.length > 0) {
            url += '?fileTo=' + fileTo;
        }
    }

    const response = await fetch(url, data.length > 0 ? {
        method: methodd,
        headers: {
            'Content-Type': 'text/plain',
        },
        body: data
    } : {
        method: methodd,
        headers: {
            'Content-Type': 'text/plain',
        }
    });
    return response;
}

// Function to download data to a file
function download(data, filename) {
    var file = new Blob([data]);
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function basename(path) {
    return path.split('/').reverse()[0];
}