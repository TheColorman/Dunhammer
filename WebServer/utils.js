// async/await error catcher
function catchAsyncErrors (callback) {
    return function (req, res, next) {
        callback(req, res, next)
            .catch(next);
    }
}

function htmlEncode(string) {
    return string
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#39;")
        .replace(/"/g, "&#34;");
}

module.exports = {
    htmlEncode,
    catchAsync: catchAsyncErrors,
};
