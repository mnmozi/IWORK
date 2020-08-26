const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.simple(),
        winston.format.colorize({ all: true })
      ),
    })
  );
}
winston.add(logger);
module.exports = logger;
