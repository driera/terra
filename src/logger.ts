export interface Logger {
  warn: (message: string) => void
}

export const consoleLogger: Logger = {
  warn: (message) => {
    if (import.meta.env.DEV) console.warn(message)
  },
}

export default consoleLogger
