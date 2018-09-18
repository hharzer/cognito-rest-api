export function catchAsyncErrors(fn: any) {
    return (req, res, next) => {
        const routePromise = fn(req, res, next);
        if (routePromise.catch) {
            routePromise.catch((err) => next(err));
        }
    };
}

