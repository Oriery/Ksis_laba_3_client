const server_url = 'http://localhost/Ksis_laba_3_server/';

let i_file = document.getElementById("i_file");
let i_urlFrom = document.getElementById("i_urlFrom");
let i_urlTo = document.getElementById("i_urlTo");

let b_put = document.getElementById("b_put");
let b_post = document.getElementById("b_post");
let b_get = document.getElementById("b_get");
let b_move = document.getElementById("b_move");
let b_copy = document.getElementById("b_copy");
let b_delete = document.getElementById("b_delete");
let b_files = document.getElementById("b_files");

// Для сообщений об ошибке или удаче
let t_response = document.getElementById("t_response");

let files_list = document.getElementById("files_list");

b_put.onclick = () => {
    if (i_urlTo.value.length == 0) {
        showMessage("Файл To не выбран");
        return;
    }

    let file = i_file.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");

        reader.onload = function(evt) {
            doRequest("PUT", server_url, evt.target.result, "", i_urlTo.value).catch(() => {});
        }

        reader.onerror = function() {
            showMessage("Ошибка при чтении файла");
        }
    } else {
        showMessage("Файл не выбран");
    }
}

b_post.onclick = () => {
    if (i_urlTo.value.length == 0) {
        showMessage("Файл To не выбран");
        return;
    }

    let file = i_file.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");

        reader.onload = function(evt) {
            doRequest("POST", server_url, evt.target.result, "", i_urlTo.value).catch(() => {})
        }

        reader.onerror = function() {
            showMessage("Ошибка при чтении файла");
        }
    } else {
        showMessage("Файл не выбран");
    }
}

b_get.onclick = () => {
    if (i_urlFrom.value.length == 0) {
        showMessage("Файл From не выбран");
        return;
    }

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
        }, () => { return new Promise((resolve, reject) => { reject() }) })
        // Create a new response out of the stream
        .then(stream => new Response(stream), () => { return new Promise((resolve, reject) => { reject() }) })
        // Create an object URL for the response
        .then(response => response.blob(), () => { return new Promise((resolve, reject) => { reject() }) })
        .then(blob => download(blob, basename(i_urlFrom.value)), () => {})
}

b_delete.onclick = () => {
    if (i_urlFrom.value.length == 0) {
        showMessage("Файл From не выбран");
        return;
    }
    doRequest("DELETE", server_url, "", i_urlFrom.value).catch(() => {});
}

b_copy.onclick = () => {
    if (i_urlFrom.value.length == 0) {
        showMessage("Файл From не выбран");
        return;
    }
    if (i_urlTo.value.length == 0) {
        showMessage("Файл To не выбран");
        return;
    }
    doRequest("COPY", server_url, "", i_urlFrom.value, i_urlTo.value).catch(() => {});
}

b_move.onclick = () => {
    if (i_urlFrom.value.length == 0) {
        showMessage("Файл From не выбран");
        return;
    }
    if (i_urlTo.value.length == 0) {
        showMessage("Файл To не выбран");
        return;
    }
    doRequest("MOVE", server_url, "", i_urlFrom.value, i_urlTo.value).catch(() => {});
}

b_files.onclick = () => {
    doRequest("FILES", server_url)
        .then(response => {
            response.text()
                .then(text => {
                    files_list.innerHTML =
                        "<div class=\"filePath\">" +
                        text.split(/(?<=")\s(?=")/).join("</div><div class=\"filePath\">")
                        .replaceAll("\"", "") +
                        "</div>";
                }, () => {})
        }, () => {})
}

b_get.addEventListener("mouseenter", () => { highlightNeededInputs(false, true, false) })
b_get.addEventListener("mouseleave", () => { highlightNeededInputs() })
b_put.addEventListener("mouseenter", () => { highlightNeededInputs(true, false, true) })
b_put.addEventListener("mouseleave", () => { highlightNeededInputs() })
b_post.addEventListener("mouseenter", () => { highlightNeededInputs(true, false, true) })
b_post.addEventListener("mouseleave", () => { highlightNeededInputs() })
b_move.addEventListener("mouseenter", () => { highlightNeededInputs(false, true, true) })
b_move.addEventListener("mouseleave", () => { highlightNeededInputs() })
b_copy.addEventListener("mouseenter", () => { highlightNeededInputs(false, true, true) })
b_copy.addEventListener("mouseleave", () => { highlightNeededInputs() })
b_delete.addEventListener("mouseenter", () => { highlightNeededInputs(false, true, false) })
b_delete.addEventListener("mouseleave", () => { highlightNeededInputs() })

files_list.onclick = e => {
    if (e.target == files_list) return;

    const textCopied = " <span style=\"color:blue;\">(copied)</span>";

    e.target.innerHTML = e.target.innerHTML.replace(textCopied, "");

    navigator.clipboard.writeText(e.target.innerHTML)
        .then(() => {
            e.target.innerHTML += textCopied;
            setTimeout(() => { e.target.innerHTML = e.target.innerHTML.replace(textCopied, "") }, 600);
        })
}

function doRequest(methodd, url, data = "", fileFrom = "", fileTo = "") {
    return new Promise((resolve, reject) => {
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

        fetch(url, data.length > 0 ? {
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
            })
            .then(response => {
                    showResponse(response);

                    if (response.ok) {
                        return resolve(response);
                    } else {
                        return reject();
                    }
                },
                () => { return reject() });
    })
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

function highlightNeededInputs(file = false, from = false, to = false) {
    if (file) {
        i_file.setAttribute("isHighlighted", "");
    } else {
        i_file.removeAttribute("isHighlighted");
    }

    if (from) {
        i_urlFrom.setAttribute("isHighlighted", "");
    } else {
        i_urlFrom.removeAttribute("isHighlighted");
    }

    if (to) {
        i_urlTo.setAttribute("isHighlighted", "");
    } else {
        i_urlTo.removeAttribute("isHighlighted");
    }
}

function showResponse(response) {
    let message;
    if (response.ok) {
        message = "Успех: ";
    } else {
        message = "Ошибка " + response.status + ": ";
    }

    message += response.statusText;

    showMessage(message);
}

function showMessage(message) {
    t_response.innerHTML = message;

    t_response.removeAttribute("hidden");
    setTimeout(() => { t_response.setAttribute("hidden", "") }, 2000);
}