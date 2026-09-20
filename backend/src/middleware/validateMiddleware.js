// Checks req.body (or req.query / req.params) against a Zod schema.
// Bad input becomes a clean 400 error. Good input is cleaned and saved in req.validated.
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);

    req.validated ??= {};
    req.validated[source] = result.data;
    if (source === 'body') req.body = result.data;
    next();
  };
}