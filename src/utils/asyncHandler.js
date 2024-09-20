const asyncHanlder = (requstHandler) => {
  return (req, res, next) => {
    Promise.resolve(requstHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHanlder };
