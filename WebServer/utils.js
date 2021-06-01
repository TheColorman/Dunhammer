// async/await error catcher
const catchAsyncErrors = (fn) => (req, res, next) => {
    const routePromise = fn(req, res, next);
    if (routePromise.catch) {
        routePromise.catch((err) => next(err));
    }
};

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
