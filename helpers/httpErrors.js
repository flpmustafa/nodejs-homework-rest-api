const errorMessage = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
  };
  
  
  class HttpError extends Error {
    constructor(status, message = errorMessage[status]) {
      super(message);
      this.status = status;
    }
  }
  
  module.exports = HttpError;