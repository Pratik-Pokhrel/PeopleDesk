// Usage of this file : validate({ body: schema, query: schema, params: schema })

// A fail in parsing throws a ZodError, which the central error handler turns into a 400 response

export const validate = (schemas) => (req, res, next) => {
  req.validated = {};
  for (const key of ["params", "query", "body"]) {
    if (schemas[key]) {
      req.validated[key] = schemas[key].parse(req[key]);
    }
  }
  next(); // Pass control to the next middleware
};
